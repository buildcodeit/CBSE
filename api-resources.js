// api/resources.js
// Vercel serverless function — scans subject folders, reads text files, returns JSON

const fs   = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const root = path.join(process.cwd(), 'resources-data');

    if (!fs.existsSync(root)) {
      return res.status(200).json({});
    }

    const result = {};

    const subjects = fs.readdirSync(root).filter(item =>
      fs.statSync(path.join(root, item)).isDirectory()
    );

    subjects.forEach(subject => {
      const subjectPath = path.join(root, subject);
      result[subject] = {};

      const subfolders = fs.readdirSync(subjectPath).filter(item =>
        fs.statSync(path.join(subjectPath, item)).isDirectory()
      );

      subfolders.forEach(subfolder => {
        const textFile = path.join(subjectPath, subfolder, 'text');
        if (!fs.existsSync(textFile)) return;

        const lines   = fs.readFileSync(textFile, 'utf8').split('\n');
        const entries = [];

        lines.forEach(line => {
          line = line.trim();
          if (!line) return;
          const idx   = line.indexOf('|');
          if (idx < 0) return;
          const title = line.slice(0, idx).trim();
          const link  = line.slice(idx + 1).trim();
          if (title && link) entries.push({ title, link });
        });

        if (entries.length) result[subject][subfolder] = entries;
      });
    });

    return res.status(200).json(result);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
