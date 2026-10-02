Write-Host "Installing Campus Quest unit-test dependencies..."
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm pkg set scripts.test="vitest run"
npm pkg set scripts."test:watch"="vitest"
npm pkg set scripts."test:coverage"="vitest run --coverage"

Write-Host ""
Write-Host "Setup complete. Running unit tests..."
npm test
