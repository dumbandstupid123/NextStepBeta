from astrapy import DataAPIClient

# Initialize the client
client = DataAPIClient("AstraCS:KYBuAfvcxKMeiFrnitzLLDJZ:ff050b3a5bb3fad519b996e258a8044c9ba60589dd5cd52565b7a473f9c8804d")
db = client.get_database_by_api_endpoint(
  "https://514fce31-27da-4d5d-bbf3-a8d41692de82-us-east-2.apps.astra.datastax.com"
)

print(f"Connected to Astra DB: {db.list_collection_names()}")


