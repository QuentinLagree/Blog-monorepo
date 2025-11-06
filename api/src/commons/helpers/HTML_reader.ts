import fs from 'fs';

export const readHTMLFile = (path: string, callback: CallableFunction) => {
  fs.readFile(path, { encoding: 'utf-8' }, (err, html) => {
    if (err) {
      callback(err);
    } else {
      callback(null, html);
    }
  });
};
