
// Main API file that re-exports all the functionality
import { uploadFile } from './storage';
import { generateScript } from './scriptGeneration';
import { generateVideo } from './videoGeneration';
import { checkProgress, getVideos } from './videoManagement';
import { getProgressFromStorage, updateProgressInStorage } from './storage';

export {
  uploadFile,
  generateScript,
  generateVideo,
  checkProgress,
  getVideos,
  getProgressFromStorage,
  updateProgressInStorage
};
