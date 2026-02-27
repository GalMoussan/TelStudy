import '@testing-library/jest-dom';

// Polyfill File.prototype.text() — jsdom's File doesn't inherit Blob.text()
if (typeof File !== 'undefined' && typeof File.prototype.text !== 'function') {
  Object.defineProperty(File.prototype, 'text', {
    value: function (): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(this);
      });
    },
    writable: true,
    configurable: true,
  });
}
