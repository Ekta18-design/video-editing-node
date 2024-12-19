const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3005;

// Define file paths
const inputVideoPath = path.join(__dirname, 'videos', 'input-video.mp4');
const outputVideoPath = path.join(__dirname, 'output', 'output_with_logo_text.mp4');
const logoPath = path.join(__dirname, 'videos', 'logo.png');

// Debug file paths
console.log('Input Video Path:', inputVideoPath);
console.log('Logo Path:', logoPath);
console.log('Output Video Path:', outputVideoPath);

// Ensure output directory exists
const outputDir = path.dirname(outputVideoPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to overlay text and logo on video
function addTextAndLogoToVideo(callback) {
  ffmpeg(inputVideoPath)
    .input(logoPath)
    .outputOptions([
      '-filter_complex',
      // Adjust logo size and position
      '[1:v]scale=50:-5[logo];' + // Decrease the logo size here
      // Overlay the logo at the bottom-right corner
      '[0:v][logo]overlay=W-w-10:H-h-10,' +
      // Add text with a horizontal offset to the left of the logo
      'drawtext=text=\'cobranding\':fontcolor=white:fontsize=24:x=W-tw-85:y=H-th-10' // Adjust x offset to align with the smaller logo
    ])
    .output(outputVideoPath)
    .on('start', (commandLine) => {
      console.log('Started processing with command: ' + commandLine);
    })
    .on('progress', (progress) => {
      console.log('Processing: ' + progress.percent + '% done');
    })
    .on('end', () => {
      console.log('Processing finished successfully!');
      if (callback) callback();
    })
    .on('error', (err) => {
      console.error('Error occurred: ' + err.message);
      console.error('Command that failed: ', err.cmd);
      if (callback) callback(err);
    })
    .run();
}

// Express route to trigger video processing
app.get('/process-video', (req, res) => {
  addTextAndLogoToVideo((err) => {
    if (err) {
      res.status(500).send('Error processing video.');
    } else {
      res.send('Video processing complete. <a href="/output/output_with_logo_text.mp4">Download the processed video</a>');
    }
  });
});

// Serve static files from the output directory
app.use('/output', express.static(path.join(__dirname, 'output')));

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
