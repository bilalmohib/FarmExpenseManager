declare module 'react-native-html-to-pdf' {
  interface Options {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
    height?: number;
    width?: number;
    padding?: number;
    // Add other options based on the library's documentation if needed
  }

  interface Pdf {
    filePath?: string;
    base64?: string;
    numberOfPages?: number;
  }

  const RNHTMLtoPDF: {
    convert: (options: Options) => Promise<Pdf>;
  };

  export default RNHTMLtoPDF;
} 