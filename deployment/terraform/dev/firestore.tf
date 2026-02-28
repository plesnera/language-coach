# Enable Firestore API
resource "google_project_service" "firestore" {
  project            = var.dev_project_id
  service            = "firestore.googleapis.com"
  disable_on_destroy = false
}

# Create the Firestore database (Native mode)
resource "google_firestore_database" "default" {
  project     = var.dev_project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.firestore]
}
