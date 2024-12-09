import datetime
import time
import threading
import pyodbc

# Database connection details
server = 'Database Host Name'
database = 'processControllDB'
username = 'sql username'
password = 'sql password'
connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'

# Thread-local storage for database connection and cursor
thread_local = threading.local()


def get_db_connection():
    if not hasattr(thread_local, 'conn'):
        thread_local.conn = pyodbc.connect(connection_string)
        thread_local.cursor = thread_local.conn.cursor()
    return thread_local.conn, thread_local.cursor

def get_device_names():
    conn, cursor = get_db_connection()
    cursor.execute("SELECT id, device_name FROM device")
    devices = cursor.fetchall()
    return devices

def get_initial_values_from_db():
    conn, cursor = get_db_connection()
    cursor.execute("SELECT * FROM LatestValuesToDevices")
    rows = cursor.fetchall()
    values = {}
    for row in rows:
        device_name = row.device_name
        values[device_name] = {
            'setpoint': float(row.setpoint or 0),
            'kp': float(row.kp or 0),
            'ti': float(row.ti or 0),
            'td': float(row.td or 0),
            'alpha': float(row.alpha or 0)
        }
    return values


def insert_device_setpoint(device_id, setpoint):
    conn, cursor = get_db_connection()
    cursor.execute(f"INSERT INTO controller (deviceID, setpoint) VALUES ({device_id}, {setpoint})")
    cursor.commit()


def insert_pid_settings(device_id, variable, value):
    conn, cursor = get_db_connection()
    cursor.execute(f"INSERT INTO controller (deviceID, {variable}) VALUES ({device_id}, {value})")
    conn.commit()


def insert_filter_alpha(device_id, alpha):
    conn, cursor = get_db_connection()
    cursor.execute(f"INSERT INTO filter (deviceID, alpha) VALUES ({device_id}, {alpha})")
    conn.commit()


def get_last_temperature_reading(device_id):
    conn, cursor = get_db_connection()
    if device_id:
        cursor.execute(
            f"SELECT TOP 1 * FROM temperatures WHERE deviceID = {device_id} ORDER BY recorded_at DESC;")
    else:
        cursor.execute(
            f"SELECT TOP 1 * FROM temperatures ORDER BY recorded_at DESC;")
    row = cursor.fetchone()  # fetch a single row
    latest_values = {}
    if row:
        # Convert the row into a dictionary with column names as keys
        if row.temperature is not None:
            latest_values['temperature'] = round(float(row.temperature), 2)
        if hasattr(row, 'temperature_unit') and row.unit is not None:
            latest_values['temperature_unit'] = row.unit
        if row.recorded_at is not None:
            latest_values['temperature_recorded_at'] = row.recorded_at.timestamp()
    return latest_values



def get_controller_value(column, device_id):
    conn, cursor = get_db_connection()
    cursor.execute(f"SELECT TOP 1 {column} FROM LatestValuesToDevices WHERE device_name = (SELECT device_name FROM device WHERE id = {device_id}) ORDER BY recorded_at DESC;")
    row = cursor.fetchone()  # fetch a single row
    if row:
        last_value = float(row[0])
        return last_value
    return None


def get_latest_device_values(device_id):
    conn, cursor = get_db_connection()
    latest_values = {}
    cursor.execute(f"SELECT * FROM LatestValuesToDevices WHERE device_name = (SELECT device_name FROM device WHERE id = {device_id})")
    row = cursor.fetchone()  # fetch a single row
    if not row:
        return latest_values  # Return empty dictionary if no data found

        # Map column names to their corresponding values dynamically
    column_names = [column[0] for column in cursor.description]
    for idx, column in enumerate(column_names):
        value = row[idx]
        if value is None:
            continue  # Skip null values

        # Handle specific formatting for known columns
        if column in ['setpoint', 'kp', 'ti', 'td', 'alpha']:
            latest_values[column] = float(value)
        elif column == 'recorded_at':
            latest_values[column] = value
        else:
            latest_values[column] = value  # Keep as-is for other columns
    return latest_values
