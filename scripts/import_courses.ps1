
$sourceRoot = "D:\A21\web scrapper\w3schools\www.w3schools.com"

# List of courses to import (Folder Name -> Title)
# You can add more here based on the folders in your directory
$courses = @{
    "rust" = "Rust Programming"
    "aws" = "AWS Cloud"
    "git" = "Git Version Control"
    "go" = "Go (Golang)"
    "kotlin" = "Kotlin"
    "mongodb" = "MongoDB"
    "postgresql" = "PostgreSQL"
    "typescript" = "TypeScript"
}

foreach ($key in $courses.Keys) {
    if (Test-Path "$sourceRoot\$key") {
        Write-Host "Importing $key..."
        node scripts/w3s-importer.js "$sourceRoot\$key" $key $courses[$key]
    } else {
        Write-Warning "Folder $key not found in source."
    }
}

Write-Host "Bulk import complete. Please run the Migration Tool in the app to sync to Firestore."
