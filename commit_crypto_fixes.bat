@echo off
echo Committing crypto payment fixes...
git add .
git commit -m "Fix crypto payment amount calculation and wallet addresses"
echo.
echo Deploying to Vercel...
vercel --prod
echo.
echo Crypto payment fixes deployed!
pause