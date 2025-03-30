
import { File } from '@/types';

// Define an extended File interface to include our custom publicUrl property
export interface FileWithPublicUrl extends File {
  publicUrl?: string;
}
