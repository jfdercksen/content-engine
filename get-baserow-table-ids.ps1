# PowerShell Script to Get Baserow Table IDs
# Run this after creating the blog workflow tables

$baserowUrl = "https://baserow.aiautomata.co.za"
$databaseId = 176  # Modern Management database
$token = "SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1"

Write-Host "🔍 Fetching table information for Modern Management database..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Token $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "$baserowUrl/api/database/tables/database/$databaseId/" -Headers $headers -Method GET
    $tables = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Found $($tables.Count) tables in database $databaseId" -ForegroundColor Green
    Write-Host ""
    
    # Filter for blog-related tables
    $blogTables = $tables | Where-Object { 
        $_.name -like "*blog*" -or 
        $_.name -like "*Blog*" -or
        $_.name -like "*keyword*" -or
        $_.name -like "*Keyword*"
    }
    
    if ($blogTables.Count -gt 0) {
        Write-Host "📋 Blog Workflow Tables:" -ForegroundColor Yellow
        Write-Host "=========================" -ForegroundColor Yellow
        
        foreach ($table in $blogTables) {
            Write-Host "Table: $($table.name)" -ForegroundColor White
            Write-Host "  ID: $($table.id)" -ForegroundColor Green
            Write-Host "  Description: $($table.description)" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "🔧 n8n Workflow Configuration:" -ForegroundColor Cyan
        Write-Host "===============================" -ForegroundColor Cyan
        
        $config = @{}
        foreach ($table in $blogTables) {
            $key = $table.name.ToLower() -replace "[^a-z0-9]", ""
            $config[$key] = $table.id
        }
        
        $jsonConfig = $config | ConvertTo-Json -Depth 2
        Write-Host $jsonConfig -ForegroundColor White
        
        Write-Host ""
        Write-Host "📋 Copy the JSON above to your n8n workflow configuration" -ForegroundColor Yellow
        
    } else {
        Write-Host "❌ No blog-related tables found. Please create the tables first using the setup guide." -ForegroundColor Red
        Write-Host "Tables to create:" -ForegroundColor Yellow
        Write-Host "  - Blog_Requests" -ForegroundColor White
        Write-Host "  - Blog_Posts" -ForegroundColor White  
        Write-Host "  - Keyword_Research" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📊 All Tables in Database:" -ForegroundColor Cyan
    Write-Host "==========================" -ForegroundColor Cyan
    
    foreach ($table in $tables) {
        Write-Host "• $($table.name) (ID: $($table.id))" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error fetching table information: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  - Database ID is correct ($databaseId)" -ForegroundColor White
    Write-Host "  - Token has proper permissions" -ForegroundColor White
    Write-Host "  - Network connection is working" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create the blog tables using the setup guide" -ForegroundColor White
Write-Host "2. Run this script again to get the table IDs" -ForegroundColor White
Write-Host "3. Update your n8n workflow with the table IDs" -ForegroundColor White
Write-Host "4. Test the blog workflow with sample data" -ForegroundColor White
