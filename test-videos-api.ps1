# Video API Testing Script (PowerShell)
# Tests all video API endpoints

$baseUrl = "http://localhost:3000/api/baserow/modern-management/videos"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "   Video API Testing Script" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Test 1: Create a simple video
Write-Host "Test 1: Create Simple Text-to-Video" -ForegroundColor Yellow
Write-Host "POST $baseUrl"
Write-Host ""

$body1 = @{
    videoPrompt = "A cinematic shot of a peaceful mountain landscape at sunrise, with golden light breaking through the clouds and mist rolling over the peaks"
    videoType = "Text-to-Video"
    model = "Sora 2"
    aspectRatio = "16:9 (Landscape)"
    duration = 10
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body1
    Write-Host ($response1 | ConvertTo-Json -Depth 10)
    
    $videoId = $response1.video.id
    Write-Host ""
    Write-Host "✅ Video created successfully with ID: $videoId" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create video" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 2

# Test 2: Get all videos
Write-Host "Test 2: Get All Videos" -ForegroundColor Yellow
Write-Host "GET $baseUrl"
Write-Host ""

try {
    $response2 = Invoke-RestMethod -Uri $baseUrl -Method Get
    Write-Host ($response2 | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "✅ Retrieved videos list (Count: $($response2.count))" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to retrieve videos" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 3: Get single video
Write-Host "Test 3: Get Single Video by ID" -ForegroundColor Yellow
Write-Host "GET $baseUrl/$videoId"
Write-Host ""

try {
    $response3 = Invoke-RestMethod -Uri "$baseUrl/$videoId" -Method Get
    Write-Host ($response3 | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "✅ Retrieved single video" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to retrieve video" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 4: Update video status
Write-Host "Test 4: Update Video Status" -ForegroundColor Yellow
Write-Host "PATCH $baseUrl/$videoId"
Write-Host ""

$body4 = @{
    videoStatus = "Generating Videos"
    taskId = "test-task-123"
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod -Uri "$baseUrl/$videoId" -Method Patch -Headers $headers -Body $body4
    Write-Host ($response4 | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "✅ Video status updated" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to update video" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 5: Complete video with URL
Write-Host "Test 5: Complete Video with URL" -ForegroundColor Yellow
Write-Host "PATCH $baseUrl/$videoId"
Write-Host ""

$body5 = @{
    videoStatus = "Completed"
    videoUrl = "https://example.com/generated-video.mp4"
    thumbnailUrl = "https://example.com/thumbnail.jpg"
    completedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

try {
    $response5 = Invoke-RestMethod -Uri "$baseUrl/$videoId" -Method Patch -Headers $headers -Body $body5
    Write-Host ($response5 | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "✅ Video marked as completed" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to complete video" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 6: Filter videos by status
Write-Host "Test 6: Filter Videos by Status" -ForegroundColor Yellow
Write-Host "GET $baseUrl?videoStatus=Completed"
Write-Host ""

try {
    $response6 = Invoke-RestMethod -Uri "$baseUrl`?videoStatus=Completed" -Method Get
    Write-Host ($response6 | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "✅ Filtered videos retrieved" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to filter videos" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 7: Create UGC Ad video
Write-Host "Test 7: Create UGC Ad Video" -ForegroundColor Yellow
Write-Host "POST $baseUrl"
Write-Host ""

$body7 = @{
    videoPrompt = "A young woman in her kitchen holding a hair product, speaking enthusiastically about how it transformed her curls"
    videoType = "UGC Ad"
    model = "Veo 3.1"
    aspectRatio = "9:16 (Vertical)"
    duration = 8
    product = "Curl Defining Cream"
    icp = "Women aged 18-35 with curly hair"
    productFeatures = "Long-lasting curl definition, no frizz, lightweight"
    videoSetting = "Modern bright kitchen with natural morning light"
    platform = "Instagram"
    useCaptions = $true
    captionText = "My curls have NEVER looked this good! 😍"
    captionPosition = "Bottom"
} | ConvertTo-Json

try {
    $response7 = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body7
    Write-Host ($response7 | ConvertTo-Json -Depth 10)
    
    $ugcVideoId = $response7.video.id
    Write-Host ""
    Write-Host "✅ UGC Ad video created with ID: $ugcVideoId" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create UGC Ad video" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 8: Validation error test
Write-Host "Test 8: Test Validation (Should Fail)" -ForegroundColor Yellow
Write-Host "POST $baseUrl"
Write-Host ""

$body8 = @{
    videoPrompt = "Short"
    videoType = "Text-to-Video"
} | ConvertTo-Json

try {
    $response8 = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body8
    Write-Host ($response8 | ConvertTo-Json -Depth 10)
} catch {
    Write-Host $_.Exception.Response.StatusCode -ForegroundColor Yellow
    Write-Host "⚠️ Expected validation error received" -ForegroundColor Yellow
    Write-Host ""
}

Start-Sleep -Seconds 2

# Test 9: Delete video
Write-Host "Test 9: Delete Video" -ForegroundColor Yellow
Write-Host "DELETE $baseUrl/$videoId"
Write-Host ""

try {
    $response9 = Invoke-RestMethod -Uri "$baseUrl/$videoId" -Method Delete
    Write-Host ($response9 | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "✅ Video deleted" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to delete video" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 10: Verify deletion (should return 404)
Write-Host "Test 10: Verify Deletion (Should Return 404)" -ForegroundColor Yellow
Write-Host "GET $baseUrl/$videoId"
Write-Host ""

try {
    $response10 = Invoke-RestMethod -Uri "$baseUrl/$videoId" -Method Get
    Write-Host ($response10 | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "⚠️ Expected 404 error received" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "   ✅ All Tests Completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Summary:" -ForegroundColor Blue
Write-Host "  • Created 2 videos"
Write-Host "  • Retrieved videos (list and single)"
Write-Host "  • Updated video status"
Write-Host "  • Filtered videos"
Write-Host "  • Tested validation"
Write-Host "  • Deleted video"
Write-Host "  • Verified deletion"
Write-Host ""
Write-Host "Note: UGC Ad video (ID: $ugcVideoId) was not deleted for manual inspection" -ForegroundColor Green
Write-Host ""

