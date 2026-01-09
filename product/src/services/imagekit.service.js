const ImageKit = require("imagekit");
const { randomUUID } = require("crypto");

// ✅ Initialize ImageKit once
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ✅ Upload single image
async function uploadImage(fileBuffer, fileName) {
  const res = await imagekit.upload({
    file: fileBuffer,
    fileName: randomUUID(),
  });

  return {
    url: res.url,
    thumbnail: res.thumbnailUrl || res.url,
    id: res.fileId,
  };
}

// ✅ Upload multiple images
async function uploadMultipleImages(files) {
  const images = await Promise.all([]);

  for (const file of files) {
    const img = await uploadImage(
      file.buffer,
      file.originalname || `${Date.now()}`
    );
    images.push(img);
  }

  return images;
}

module.exports = {
  uploadImage,
  uploadMultipleImages,
};
