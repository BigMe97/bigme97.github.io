#include <ArduinoJson.h>
#include <PubSubClient.h>
#include "PIDClass.h"
#include "FilterClass.h"

#include <ESP8266WiFi.h>
extern WiFiClient espClient;
extern float heaterVolt, fanVolt, temperature;
extern bool automaticMode;
extern float filterAlpha;
extern PID Reg;
extern LPFilter filter;
extern String SensorID;
extern int redLed;

// MQTT
const char* mqtt_server = SECRET_MQTT_SERVER;
const int mqtt_port = SECRET_MQTT_PORT;
char mqttUser[] = SECRET_mqtt_USER;
char mqttPass[] = SECRET_mqtt_PASS;

PubSubClient client(espClient);
// Topics
const char* temperatureTopic = "airheater/temperature";  // Publish
const char* controlTopic = "airheater/controls";         // Publish(Auto)/Subscribe
const char* PIDTopic = "airheater/PID";                  // Subscribe  (PID parameters)
const char* setpointTopic = "airheater/setpoint";        // Subscribe(Auto)
const char* autoModeTopic = "airheater/auto";            // Subscribe (bool/ 0 or 1)
const char* filterTopic = "airheater/filterAlpha";       // Subscribe

StaticJsonDocument<200> jsonDoc;

void startMQTT() {
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);  // Set the function to handle incoming messages
}

// Reconnect to MQTT broker if connection is lost
void reconnectMqtt() {
  while (!client.connected()) {
    digitalWrite(redLed, HIGH);
    Serial.print("Attempting MQTT connection...");
    // Try to connect with a unique client ID
    if (client.connect("ESP8266Client2", mqttUser, mqttPass)) {
      Serial.println("connected");
      digitalWrite(redLed, LOW);
      // Subscribe to the topics after connecting
      client.subscribe(controlTopic);
      client.subscribe(PIDTopic);
      client.subscribe(setpointTopic);
      client.subscribe(autoModeTopic);
      client.subscribe(filterTopic);
      //client.loop();
      Serial.println("Leaving mqtt");

      // digitalWrite(greenLed, HIGH);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
  client.loop();
}

// Callback function to handle incoming messages from MQTT
void callback(char* topic, byte* payload, unsigned int length) {

  char jsonBuffer[length + 1];
  memcpy(jsonBuffer, payload, length);
  jsonBuffer[length] = '\0';  // Null-terminate the string

  // Define a StaticJsonDocument with a capacity of 200 bytes
  jsonDoc.clear();

  // Parse the JSON string
  DeserializationError error = deserializeJson(jsonDoc, jsonBuffer);
  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.c_str());
    return;
  }

  // Access JSON fields with error checking
  String sensorIdFromMqtt = jsonDoc["sensorID"] | "";  // Default to empty if not found
  String timestamp = jsonDoc["timestamp"] | "";        // Default to empty if not found

  // Check if sensorID was found
  if (sensorIdFromMqtt == "") {
    Serial.println("Could not find sensorID in message");
    return;
  }

  if (sensorIdFromMqtt == SensorID) {

    if (topic == autoModeTopic) {
      readAutoMode();
    }
    if (topic == controlTopic & !automaticMode) {
      readControls();
    }
    if (strcmp(topic, PIDTopic) == 0) {
      readPID();
    }
    if (strcmp(topic, setpointTopic) == 0) {
      readSetpoint();
    }
    if (strcmp(topic, filterTopic) == 0) {
      readFilter();
    }
  }
}

void writeToMqtt(String SensorID) {
  // Write temperature to MQTT
  jsonDoc.clear();
  jsonDoc["sensorID"] = SensorID;
  jsonDoc["timestamp"] = getTime();
  jsonDoc["temperature"] = temperature;
  jsonDoc["unit"] = "C";

  // Convert JSON to string
  char buffer[512];
  serializeJson(jsonDoc, buffer);
  client.publish(temperatureTopic, buffer);
  Serial.print("Publishing to temperature topic:  ");
  Serial.println(buffer);

  delay(200);

  // Write controls to MQTT
  if (automaticMode) {
    jsonDoc.clear();
    jsonDoc["sensorID"] = SensorID;
    jsonDoc["timestamp"] = getTime();
    jsonDoc["heaterPower"] = heaterVolt;
    jsonDoc["heaterUnit"] = "V";
    jsonDoc["fanPower"] = fanVolt;
    jsonDoc["fanUnit"] = "V";

    // Convert JSON to string
    char buffer[512];
    serializeJson(jsonDoc, buffer);
    client.publish(controlTopic, buffer);
    Serial.print("Publishing to control topic:  ");
    Serial.println(buffer);
  }
}


void readControls() {
  float heaterPower = jsonDoc["heaterPower"] | -1.0;
  float fanPower = jsonDoc["fanPower"] | -1.0;
  if (heaterPower > -0) { heaterVolt = heaterPower; }
  if (fanPower > -0) { fanVolt = fanPower; }
}

void readPID() {
  float pParam = jsonDoc["kP"] | -1.0;
  float iParam = jsonDoc["tI"] | -1.0;
  float dParam = jsonDoc["tD"] | -1.0;
  if (pParam > 0) { Reg.setKp(pParam); }
  if (iParam > 0) { Reg.setTi(iParam); }
  if (dParam > 0) { Reg.setTd(dParam); }
}

void readSetpoint() {
  float setp = jsonDoc["setpoint"] | -100.0;
  if (setp > -99) { Reg.setSetpoint(setp); }
  Serial.println(Reg.setpoint);
}

void readAutoMode() {
  int intMode = jsonDoc["autoMode"] | -1;
  if (intMode == 0) {
    automaticMode = false;
  }
  if (intMode == 1) {
    automaticMode = true;
  }
}

void readFilter() {
  float alpha = jsonDoc["filterAlpha"] | -1;
  if (0 < alpha && alpha < 1) { filter.setAlpha(alpha); }
}
