# PowerShell script to test Baserow API with your admin token

$token = "SXe0k6Btm7i28uZP5mp8hr5KPBoWsiE1"
$baseUrl = "https://baserow.aiautomata.co.za"

Write-Host "🔍 Testing Baserow API with your admin token..." -ForegroundColor Cyan
Write-Host "Token: $($token.Substring(0,8))..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Check user info
Write-Host "📋 Test 1: Checking user info..." -ForegroundColor Cyan
try {
    $userResponse = Invoke-RestMethod -Uri "$baseUrl/api/user/" -Method GET -Headers @{
        "Authorization" = "Token $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ User info retrieved successfully" -ForegroundColor Green
    Write-Host "   User: $($userResponse.username)" -ForegroundColor White
    Write-Host "   Email: $($userResponse.email)" -ForegroundColor White
} catch {
    Write-Host "❌ User info failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: List applications (databases)
Write-Host "📋 Test 2: Listing applications (databases)..." -ForegroundColor Cyan
try {
    $appsResponse = Invoke-RestMethod -Uri "$baseUrl/api/applications/" -Method GET -Headers @{
        "Authorization" = "Token $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Applications list retrieved successfully" -ForegroundColor Green
    Write-Host "   Found $($appsResponse.results.Count) applications" -ForegroundColor White
    
    if ($appsResponse.results.Count -gt 0) {
        Write-Host "   Applications:" -ForegroundColor White
        foreach ($app in $appsResponse.results) {
            Write-Host "     - $($app.name) (ID: $($app.id))" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Applications list failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Try to create a test database
Write-Host "📋 Test 3: Testing database creation..." -ForegroundColor Cyan
$testDbName = "test-db-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$testDbBody = @{
    name = $testDbName
    type = "database"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/applications/" -Method POST -Headers @{
        "Authorization" = "Token $token"
        "Content-Type" = "application/json"
    } -Body $testDbBody
    
    Write-Host "✅ Database creation successful!" -ForegroundColor Green
    Write-Host "   Created database: $($createResponse.name) (ID: $($createResponse.id))" -ForegroundColor White
    
    # Clean up: Delete the test database
    Write-Host "🧹 Cleaning up test database..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/applications/$($createResponse.id)/" -Method DELETE -Headers @{
            "Authorization" = "Token $token"
        }
        Write-Host "✅ Test database deleted successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Failed to delete test database: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 SUCCESS: Your token has admin permissions!" -ForegroundColor Green
    Write-Host "   You can now use this token for client creation." -ForegroundColor White
    
} catch {
    Write-Host "❌ Database creation failed: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host ""
        Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "   - Token is invalid or expired" -ForegroundColor White
        Write-Host "   - Check if token is copied correctly" -ForegroundColor White
        Write-Host "   - Regenerate token in Baserow admin panel" -ForegroundColor White
    } elseif ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host ""
        Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "   - Token lacks database creation permissions" -ForegroundColor White
        Write-Host "   - Use admin account to create token" -ForegroundColor White
        Write-Host "   - Ensure token has 'Admin' or 'Create databases' permissions" -ForegroundColor White
    }
}
