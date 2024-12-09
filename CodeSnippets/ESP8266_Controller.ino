// Custom classes
#include "PIDClass.h"
#include "FilterClass.h"

#include "secrets.h"

#include <Wire.h>
#include <Adafruit_MCP4725.h>

// System parameters
int mainCycle = 200, mainTime = 0, 
    mqttTime = 2000, mqttCycle = 2000;
String SensorID = "AirHeaterOne";

// Process parameters
float heaterVolt = 0, fanVolt = 0, temperature = 20.1;
bool automaticMode = true;
int heaterOutput = 0, fanOutput = 0;
float kP = 0.01, tI = 100000.0, tD = 0, filterAlpha = 1;

// Pin setup
int redLed = 3, greenLed = 4, temperaturePin = A0, fanPin = 7;

Adafruit_MCP4725 dac;
#define DAC_RESOLUTION    (12);

// Define custom objects
PID Reg = PID(0.01, 100000.0, 0, mainCycle, 5, 0);
LPFilter filter = LPFilter(mainCycle / 1000.0 / (6.0 * mainCycle / 1000.0));

/// <summary>                         
/// Writes a value between 0V and 5V to the output pin with of the MPC4725
/// </summary>
/// <param name="outputSignal">0-5 value</param>
void WriteOut(float outputVolt) {
  float outputADC = map(outputVolt * 1000.0, 0.0, 5000.0, 0.0, 4095.0);
  // Serial.print("Writing to DAC: ");
  // Serial.print(outputVolt);
  // Serial.println(" V");
  dac.setVoltage(outputADC, false);
}

float ReadTemp(int inputPin) {
  float ADC = analogRead(inputPin);
  float temperatureVolt = (ADC * 5.0 / 1023.0);
  // Serial.print("Input volt: ");
  // Serial.println(temperatureVolt);
  float temp = (temperatureVolt - 1.0) * 50.0 / 4.0;
  return (temp);
}

void setup() {
  // pinMode(fanPin, OUTPUT);
  // pinMode(greenLed, OUTPUT);
  pinMode(redLed, OUTPUT);
  pinMode(temperaturePin, INPUT);

  Serial.begin(115200);  //Initialize serial

  // Wi-Fi
  checkWiFi();

  // MQTT client
  startMQTT();
  delay(200);
  // For Adafruit MCP4725A1 the address is 0x62 (default)
  dac.begin(0x62);
}


void loop() {
  int tCurr = millis();
  // Connect or reconnect to WiFi
  checkWiFi();
  reconnectMqtt();

  // Run Main cycle
  if (tCurr >= mainTime) {
    cyclicRun();
    mainTime += mainCycle;
  }

  // Run MQTT cycle
  if (tCurr >= mqttTime) {
    writeToMqtt(SensorID);
    mqttTime += mqttCycle;
  }
}


void cyclicRun() {
  // Read temperature
  float RawTemp = ReadTemp(temperaturePin);
  // Filter value
  temperature = filter.filter(RawTemp);
  
  // Regulate output
  if (automaticMode){
    heaterVolt = Reg.run(temperature);
    
  }
  fanVolt = 3;
  fanOutput = map(fanVolt * 1000.0, 0.0, 3000.0, 0.0, 255.0);
  Serial.print("Setpoint: ");
  Serial.print(Reg.setpoint);
  Serial.print("C Output volt: ");
  Serial.print(heaterVolt);
  Serial.print("V Temperature: ");
  Serial.print(temperature);
  Serial.println("C");
  // Write output
  WriteOut(heaterVolt);
  // analogWrite(fanPin, fanOutput);
}



