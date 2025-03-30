
// Instead of importing a non-existent File type, we'll use the built-in File interface
// and extend our custom interface from it

// Define an extended File interface to include our custom publicUrl property
export interface FileWithPublicUrl extends File {
  publicUrl?: string;
}
