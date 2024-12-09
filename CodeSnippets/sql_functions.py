import datetime
import time
import threading
import pyodbc

# Database connection details
server = 'process-control-server.database.windows.net'
database = 'processControllDB'
username = 'sys_admin'
password = 'WorldsBestPassword007'
connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'

# Thread-local storage for database connection and cursor
thread_local = threading.local()

def get_db_connection():
    if not hasattr(thread_local, 'conn'):
        thread_local.conn = pyodbc.connect(connection_string)
        thread_local.cursor = thread_local.conn.cursor()
    return thread_local.conn, thread_local.cursor

def checkDbConnection():
    conn, cursor = get_db_connection()
    if conn is None or cursor is None:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
    return conn, cursor

def disconnectDb():
    conn, _ = get_db_connection()
    if conn:
        conn.close()

def checkDbForChanges(lastVersion):
    conn, cursor = get_db_connection()

    cursor.execute("SELECT CHANGE_TRACKING_CURRENT_VERSION() AS CurrentVersion;")
    time.sleep(0.01)
    currentDbVersion = cursor.fetchone()[0]
    if currentDbVersion != lastVersion:
        print("Changes detected!")
        lastVersion = currentDbVersion
        device_values = updateDevices()
        return lastVersion, True, device_values
    return lastVersion, False, {}

def getSensorID(sensorName):
    conn, cursor = get_db_connection()
    cursor.execute("SELECT id FROM device WHERE device_name = ?", (sensorName,))
    time.sleep(0.01)
    deviceID = cursor.fetchone()
    if deviceID:
        return deviceID[0]
    else:
        print(f"Device with name {sensorName} not found.")
        return None

def updateDevices():
    conn, cursor = get_db_connection()
    lastValues = {}

    # Get all the latest values from the view LatestValuesToDevices
    cursor.execute("SELECT * FROM LatestValuesToDevices")
    time.sleep(0.01)
    lastValuesTable = cursor.fetchall()
    try:
        for row in lastValuesTable:
            device_name = row.device_name

            if device_name not in lastValues:
                lastValues[device_name] = {}
            if row.heater_output is not None:
                lastValues[device_name]['heater_output'] = float(row.heater_output)
            if row.fan_output is not None:
                lastValues[device_name]['fan_output'] = float(row.fan_output)
            if row.kp is not None:
                lastValues[device_name]['kp'] = float(row.kp)
            if row.ti is not None:
                lastValues[device_name]['ti'] = float(row.ti)
            if row.td is not None:
                lastValues[device_name]['td'] = float(row.td)
            if row.setpoint is not None:
                lastValues[device_name]['setpoint'] = float(row.setpoint)
            if row.alpha is not None:
                lastValues[device_name]['alpha'] = float(row.alpha)
            if row.recorded_at is not None:
                lastValues[device_name]['recorded_at'] = row.recorded_at
    except Exception as e:
        print(f"Error in processing latest values to devices:\n {e}")
    return lastValues

def addTemperatureToDb(sensorName, temperature, SqlDatetime=None):
    conn, cursor = get_db_connection()
    if SqlDatetime is None:
        SqlDatetime = datetime.datetime.now()  # Get the current time if not provided
    SqlDatetime = str(SqlDatetime)
    deviceID = getSensorID(sensorName)
    if deviceID:
        cursor.execute("INSERT INTO temperatures (deviceID, recorded_at, temperature, unit) VALUES (?, ?, ?, ?)",
                       (deviceID, SqlDatetime, temperature, 'C'))
        conn.commit()
        print(f"Temperature added to DB: INSERT INTO temperatures (deviceID, recorded_at, temperature, unit) VALUES ({deviceID}, {SqlDatetime}, {temperature}, {'C'})")

def addControlsToDb(sensorName, heaterVolt, fanVolt):
    conn, cursor = get_db_connection()
    # Add control settings to the database for the specified device.
    cursor.execute("SELECT id FROM device WHERE device_name = ?", (sensorName,))
    deviceID = cursor.fetchone()
    print(f'Adding controls to {deviceID}')
    if deviceID:
        deviceID = deviceID[0]
        heaterUnit = 'V' if heaterVolt is not None else None
        fanUnit = 'V' if fanVolt is not None else None

        # Insert control settings into the database
        if heaterVolt is not None or fanVolt is not None:
            cursor.execute(
                "INSERT INTO controls (deviceID, heater_output, heater_unit, fan_output, fan_unit) VALUES (?, ?, ?, ?, ?)",
                (deviceID, heaterVolt, heaterUnit, fanVolt, fanUnit)
            )
            conn.commit()
            print(f"Controls added to DB for {sensorName}: Heater {heaterVolt}{heaterUnit}, Fan {fanVolt}{fanUnit}")
    else:
        print(f"Device {sensorName} not found in the database.")
