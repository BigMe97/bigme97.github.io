import os
import time
import datetime
import threading
from flask import Flask, redirect, render_template, request, send_from_directory, url_for, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_socketio import SocketIO, emit
from sql_functions import (get_initial_values_from_db,
                           get_device_names,
                           insert_pid_settings,
                           insert_filter_alpha,
                           insert_device_setpoint,
                           get_latest_device_values,
                           get_last_temperature_reading,
                           get_controller_value,)

app = Flask(__name__)
# app.config['PREFERRED_URL_SCHEME'] = 'https'
# app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
socketio = SocketIO(app)

# Global variable to store initial values
initial_values = {}

def start_change_monitoring_thread():
    """Starts a background thread to monitor the database for changes."""
    last_values = get_initial_values_from_db()
    last_temperatures = get_last_temperature_reading(None)
    change_thread = threading.Thread(target=check_for_changes, args=(last_values, last_temperatures, ))
    change_thread.daemon = True
    change_thread.start()


# This will run in the background to check for changes in the database
def check_for_changes(last_values, last_temperatures):
    """Background thread to check for changes in the database."""
    while True:
        try:
            new_values = get_initial_values_from_db()
            if new_values != last_values:
                last_values.update(new_values)
                socketio.emit('values_updated', new_values)
            get_device_names()
            new_temperatures = get_last_temperature_reading(None)
            if new_temperatures != last_temperatures:
                last_temperatures = new_temperatures
                print('New temperature values!!!')
                socketio.emit('values_updated', new_values)

            time.sleep(2)
        except Exception as e:
            print(f"Error in check_for_changes: {e}")


@app.route('/get_device_data/<int:device_id>')
def get_device_data(device_id):
    try:
        device_data = get_latest_device_values(device_id) or {}
        last_temps = get_last_temperature_reading(device_id)
        if last_temps:
            device_data.update(last_temps)
        if not device_data:
            # Return a 404 error if no device data is found
            return jsonify({"error": "Device not found"}), 404
        return jsonify(device_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get_current_alpha/<int:device_id>')
def get_current_alpha(device_id):
    try:
        alpha_value = get_controller_value('alpha', device_id)

        if alpha_value:
            return jsonify({'alpha': alpha_value})  # Return the alpha value as a JSON response
        else:
            # Return a 404 error if no alpha value is found for the device
            return jsonify({"error": "Alpha value not found for device"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get_current_kp/<int:device_id>')
def get_current_kp(device_id):
    try:
        value = get_controller_value('kp', device_id)

        if value:
            return jsonify({'kp': value})  # Return the alpha value as a JSON response
        else:
            # Return a 404 error if no alpha value is found for the device
            return jsonify({"error": "Kp value not found for device"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get_current_ti/<int:device_id>')
def get_current_ti(device_id):
    try:
        value = get_controller_value('ti', device_id)

        if value:
            return jsonify({'ti': value})  # Return the alpha value as a JSON response
        else:
            # Return a 404 error if no alpha value is found for the device
            return jsonify({"error": "Ti value not found for device"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get_current_td/<int:device_id>')
def get_current_td(device_id):
    try:
        value = get_controller_value('td', device_id)

        if value:
            return jsonify({'td': value})  # Return the alpha value as a JSON response
        else:
            # Return a 404 error if no alpha value is found for the device
            return jsonify({"error": "Td value not found for device"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def index():
    devices = get_device_names()
    devices = devices or "Not connected"
    return render_template('index.html', devices=devices)


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.png', mimetype='image/vnd.microsoft.icon')


@app.route('/get_initial_values', methods=['GET'])
def get_initial_values():
    # Retrieve the initial values from the database
    values = get_initial_values_from_db()
    return jsonify(values)


@app.route('/adjust_setpoint/<int:device_id>', methods=['POST'])
def adjust_setpoint(device_id):
    data = request.get_json()
    new_setpoint = data.get('setpoint')

    # Logic to update the setpoint in the database
    if new_setpoint is not None:
        insert_device_setpoint(device_id, new_setpoint)
        return jsonify({"message": "Setpoint updated successfully"}), 200
    else:
        return jsonify({"error": "Invalid setpoint value"}), 400



@app.route('/adjust_filter_alpha/<int:device_id>', methods=['POST'])
def adjust_filter_alpha(device_id):
    # Parse adjustment from request
    adjustment = float(request.form['adjustment'])

    # Fetch the current filter_alpha value
    alpha_value = get_controller_value('alpha', device_id)

    # Calculate new alpha value
    new_alpha = alpha_value + adjustment

    # Update the new alpha value in the database
    insert_filter_alpha(device_id, new_alpha)

    # Notify clients about the change
    socketio.emit('alpha_changed', {'device_id': device_id, 'value': new_alpha})
    return "OK", 200


@app.route('/adjust_kp/<int:device_id>', methods=['POST'])
def adjust_kp(device_id):
    # Parse adjustment from request
    adjustment = float(request.form['adjustment'])
    value = get_controller_value('kp', device_id)
    new_value = value + adjustment
    insert_pid_settings(device_id, 'kp', new_value)
    socketio.emit('pid_changed', {'device_id': device_id, 'value': new_value})
    return "OK", 200


@app.route('/adjust_ti/<int:device_id>', methods=['POST'])
def adjust_ti(device_id):
    # Parse adjustment from request
    adjustment = float(request.form['adjustment'])
    value = get_controller_value('ti', device_id)
    new_value = value + adjustment
    insert_pid_settings(device_id, 'ti', new_value)
    socketio.emit('pid_changed', {'device_id': device_id, 'value': new_value})
    return "OK", 200


@app.route('/adjust_td/<int:device_id>', methods=['POST'])
def adjust_td(device_id):
    # Parse adjustment from request
    adjustment = float(request.form['adjustment'])
    value = get_controller_value('td', device_id)
    new_value = value + adjustment
    insert_pid_settings(device_id, 'td', new_value)
    socketio.emit('pid_changed', {'device_id': device_id, 'value': new_value})
    return "OK", 200


@app.route('/update_filter_alpha', methods=['POST'])
def update_filter_alpha():
    data = request.get_json()
    device_id = data.get('device_id')
    alpha = data.get('alpha')
    if device_id is None or alpha is None:
        return jsonify({'error': 'Invalid input'}), 400
    insert_filter_alpha(device_id, alpha)
    return jsonify({'message': 'Filter alpha updated'})


@socketio.on('connect')
def handle_connect():
    try:
        latest_values = get_initial_values_from_db()
        for device, values in latest_values.items():
            if 'recorded_at' in values and isinstance(values['recorded_at'], datetime.datetime):
                values['recorded_at'] = values['recorded_at'].isoformat()
        emit('values_updated', latest_values)
    except Exception as e:
        print(f"Error in handle_connect: {e}")


if __name__ == '__main__':
    # Start change monitoring in a background thread
    start_change_monitoring_thread()

    # Run Flask app with SocketIO
    socketio.run(app, allow_unsafe_werkzeug=True)
