import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const routeResolver = (req, res) => {
  const filePath = path.join(__dirname, '../public', req.path);

  fs.access(filePath, fs.constants.F_OK, err => {
    if (err) {
      return res.status(404).sendFile(path.join(__dirname, '../public','404', '404.html'));
    }
    res.sendFile(filePath);
  });
};
