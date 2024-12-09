
import time
from sql_functions import checkDbConnection, checkDbForChanges, disconnectDb
from mqtt_functions import startMqtt, publishChangesToMqtt

# Database connection details
server = 'Database Server name'
database = 'processControllDB'
username = 'Database Username'  # Use your actual username here
password = 'Database Password'  # Use your actual password here
# Define the connection string
connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'

lastDbVersion = 0
change = False

if __name__ == '__main__':
    try:
        startMqtt()
        while True:
            try:
                conn, cursor = checkDbConnection()
                lastDbVersion, change, devices = checkDbForChanges(lastDbVersion)
                if change:
                    print(f'Devices: {devices}')
                    for device_name, updates in devices.items():
                        print(f'Current Device: {device_name}')
                        publishChangesToMqtt(device_name, updates)
                change = False
                time.sleep(1)
            except Exception as e:
                print(f"Error during processing: {e}")
                break
    except KeyboardInterrupt:
        disconnectDb()
        print('Exiting...')



