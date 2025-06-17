import requests
import json
import xml.etree.ElementTree as ET
from datetime import datetime
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_mongodb_connection():
    try:
        # Direct connection string
        client = MongoClient("mongodb+srv://data_IT:data_IT@apml.6w5pyjg.mongodb.net/")
        db = client.autowhat_fms
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")
        return None

def fetch_vehicle_documents(vehicle_number):
    try:
        response = requests.post(
            'https://scmapml.com/verify/vahan',
            json={"vehiclenumber": vehicle_number},
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"\nResponse Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        print(f"Response Body: {response.text}\n")
        
        if response.status_code == 200:
            data = response.json()
            if data['code'] == '200' and data['response']:
                xml_data = data['response'][0]['response']
                print(f"XML Data: {xml_data}\n")
                root = ET.fromstring(xml_data)
                
                return {
                    'vehicleNumber': vehicle_number,
                    'insuranceExpiry': root.find('.//rc_insurance_upto').text if root.find('.//rc_insurance_upto') is not None else '',
                    'permitExpiry': root.find('.//rc_np_upto').text if root.find('.//rc_np_upto') is not None else '',
                    'pucExpiry': root.find('.//rc_pucc_upto').text if root.find('.//rc_pucc_upto') is not None else '',
                    'fitnessExpiry': root.find('.//rc_fit_upto').text if root.find('.//rc_fit_upto') is not None else '',
                    'taxExpiry': root.find('.//rc_tax_upto').text if root.find('.//rc_tax_upto') is not None else '',
                    'lastUpdated': datetime.now().isoformat()
                }
    except Exception as e:
        print(f"Error fetching documents for {vehicle_number}: {str(e)}")
    return None

def update_json_file(documents, json_path):
    try:
        with open(json_path, 'w') as f:
            json.dump(documents, f, indent=2)
        print(f"Updated JSON file with {len(documents)} records")
    except Exception as e:
        print(f"Error updating JSON file: {str(e)}")

def main():
    # Create data directory if it doesn't exist
    if not os.path.exists('data'):
        os.makedirs('data')
    
    json_path = 'data/vehicle_documents.json'
    
    # Load existing documents if any
    existing_documents = []
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r') as f:
                existing_documents = json.load(f)
            print(f"Loaded {len(existing_documents)} existing records from JSON file")
        except Exception as e:
            print(f"Error loading existing JSON file: {str(e)}")
    
    # Connect to MongoDB
    db = get_mongodb_connection()
    if db is None:
        print("Failed to connect to MongoDB. Exiting...")
        return

    try:
        # Get all vehicle numbers from the vehicles collection
        vehicles = db.vehicle.find({}, {'vehicleNumber': 1})
        vehicle_numbers = [vehicle['vehicleNumber'] for vehicle in vehicles]
        
        if not vehicle_numbers:
            print("No vehicles found in the database")
            return

        total_vehicles = len(vehicle_numbers)
        print(f"\nFound {total_vehicles} vehicles in the database")
        
        # Create a set of existing vehicle numbers for quick lookup
        existing_vehicle_numbers = {doc['vehicleNumber'] for doc in existing_documents}
        
        # Fetch and update documents
        documents = existing_documents.copy()
        processed_count = 0
        success_count = 0
        error_count = 0
        
        for vehicle_number in vehicle_numbers:
            processed_count += 1
            print(f"\nProcessing vehicle {processed_count}/{total_vehicles}: {vehicle_number}")
            
            # Skip if already processed
            if vehicle_number in existing_vehicle_numbers:
                print(f"Skipping {vehicle_number} - already processed")
                continue
                
            doc = fetch_vehicle_documents(vehicle_number)
            if doc:
                documents.append(doc)
                success_count += 1
                # Update JSON file after each successful fetch
                update_json_file(documents, json_path)
            else:
                error_count += 1
            
            # Print progress
            print(f"\nProgress: {processed_count}/{total_vehicles} vehicles processed")
            print(f"Success: {success_count}, Errors: {error_count}")
        
        print("\nFinal Summary:")
        print(f"Total vehicles processed: {processed_count}")
        print(f"Successfully fetched: {success_count}")
        print(f"Errors encountered: {error_count}")
        print(f"Total records in JSON file: {len(documents)}")

    except Exception as e:
        print(f"Error processing vehicles: {str(e)}")
    finally:
        # Close MongoDB connection
        if db:
            db.client.close()

if __name__ == "__main__":
    main() 