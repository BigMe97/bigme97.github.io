import paho.mqtt.client as mqtt
import json
from datetime import datetime
from sql_functions import addTemperatureToDb, addControlsToDb

# MQTT Settings
MQTT_BROKER = "172.20.10.6"
MQTT_PORT = 1883
MQTT_USER = "admin"
MQTT_PASS = "admin"
MQTT_SUBSCRIBE_TOPICS = ["airheater/temperature", "airheater/controls"]

# MQTT Client
client = mqtt.Client()


# Function to initialize the MQTT client and start the loop
def startMqtt():
    # Set the username and password if needed
    client.username_pw_set(MQTT_USER, MQTT_PASS)

    # Assign the callback functions
    client.on_connect = on_connect
    client.on_message = on_message

    # Connect to the MQTT broker
    client.connect(MQTT_BROKER, MQTT_PORT, 60)

    # Start the MQTT client loop (non-blocking)
    client.loop_start()


# Connection callback
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    # Subscribe to topics after successful connection
    for topic in MQTT_SUBSCRIBE_TOPICS:
        client.subscribe(topic)
        print(f"Subscribed to {topic}")


# Message handling callback
def on_message(client, userdata, message):
    # print(f"Message received on {message.topic}: {message.payload}")
    if message.topic == "airheater/temperature":
        handle_temperature(client, userdata, message)
    elif message.topic == "airheater/controls":
        handle_controls(client, userdata, message)
    else:
        print(f"No handler for topic {message.topic}")


# Handle temperature message
def handle_temperature(client, userdata, message):
    try:
        payload = json.loads(message.payload.decode())
        # print(f"Temperature message: {payload}")
        sensor_name = payload.get("sensorID")
        unix_timestamp = payload.get("timestamp")
        dt = datetime.fromtimestamp(unix_timestamp).strftime('%Y-%m-%d %H:%M:%S') if unix_timestamp else datetime.now()
        temperature = payload.get("temperature")

        if sensor_name and temperature is not None:
            addTemperatureToDb(sensor_name, temperature, dt)
    except Exception as e:
        print(f"Error processing temperature message: {e}")


# Handle controls message
def handle_controls(client, userdata, message):
    try:
        payload = json.loads(message.payload.decode())
        # print(f"Controls message received: {payload}")
        sensor_name = payload.get("sensorID")
        heater_volt = payload.get("heaterPower")  # Voltage for the heater
        fan_volt = payload.get("fanPower")  # Voltage for the fan

        if sensor_name:
            addControlsToDb(sensor_name, heater_volt, fan_volt)
        else:
            print("Sensor name missing in the payload.")
    except json.JSONDecodeError:
        print("Error: Unable to decode the JSON payload.")
    except Exception as e:
        print(f"Error processing controls message: {e}")


# Publish changes to MQTT
def publishChangesToMqtt(device_name, DbData):
    # Check if 'heater_output' or 'fan_output' exists in DbData and publish to 'airheater/controls'
    if 'heater_output' in DbData or 'fan_output' in DbData:
        payload = {
            "sensorID": device_name,
            "heaterVolt": DbData.get('heater_output'),
            "fanVolt": DbData.get('fan_output')
        }
        # client.publish("airheater/controls", json.dumps(payload))
        # print(f"Published to 'airheater/controls' for {device_name}: {payload}")

    # Check if 'kp', 'ti', or 'td' exists in DbData and publish to 'airheater/PID'
    if 'kp' in DbData or 'ti' in DbData or 'td' in DbData:
        payload = {
            "sensorID": device_name,
            "kP": DbData.get('kp'),
            "tI": DbData.get('ti'),
            "tD": DbData.get('td')
        }
        client.publish("airheater/PID", json.dumps(payload))
        print(f"Published to 'airheater/PID' for {device_name}: {payload}")

    # Check if 'setpoint' exists in DbData and publish to 'airheater/setpoint'
    if 'setpoint' in DbData:
        payload = {
            "sensorID": device_name,
            "setpoint": DbData.get('setpoint')
        }
        client.publish("airheater/setpoint", json.dumps(payload))
        print(f"Published to 'airheater/setpoint' for {device_name}: {payload}")

    # Check if 'autoMode' exists in DbData and publish to 'airheater/auto'
    if 'autoMode' in DbData:
        payload = {
            "sensorID": device_name,
            "autoMode": 1 if DbData.get('autoMode') else 1
        }
        client.publish("airheater/auto", json.dumps(payload))
        print(f"Published to 'airheater/auto' for {device_name}: {payload}")

    # Check if 'filterAlpha' exists in DbData and publish to 'airheater/filterAlpha'
    if 'alpha' in DbData:
        payload = {
            "sensorID": device_name,
            "filterAlpha": DbData.get('alpha')
        }
        client.publish("airheater/filterAlpha", json.dumps(payload))
        print(f"Published to 'airheater/filterAlpha' for {device_name}: {payload}")
