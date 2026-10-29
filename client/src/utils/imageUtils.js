/**
 * Client-side Automatic Product Background Removal & White Studio Framing
 * Analyzes perimeter background color, segments foreground product,
 * replaces background with pure #FFFFFF, and centers product cleanly.
 */

export const processProductToWhiteBackground = (fileOrUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Scale down if image is huge for fast smooth processing
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Draw original image
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Sample border pixels to detect background color profile
        const samplePoints = [
          [2, 2], [width - 3, 2], [2, height - 3], [width - 3, height - 3],
          [Math.floor(width / 2), 2], [Math.floor(width / 2), height - 3],
          [2, Math.floor(height / 2)], [width - 3, Math.floor(height / 2)],
          [10, 10], [width - 11, 10], [10, height - 11], [width - 11, height - 11]
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        for (const [sx, sy] of samplePoints) {
          const idx = (sy * width + sx) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        }
        bgR /= samplePoints.length;
        bgG /= samplePoints.length;
        bgB /= samplePoints.length;

        // Center coordinates of product
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

        // Process pixels: background pixels replaced with pure #FFFFFF
        const threshold = 38; // Sensitivity threshold for background detection

        let minX = width, maxX = 0, minY = height, maxY = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Color distance from sampled background
            const dR = r - bgR;
            const dG = g - bgG;
            const dB = b - bgB;
            const colorDist = Math.sqrt(dR * dR + dG * dG + dB * dB);

            // Normalized distance from center (products are placed in the center of the photo)
            const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / maxDist;

            // Near the image border, be more aggressive at clearing background
            const isNearBorder = (x < 15 || x > width - 15 || y < 15 || y > height - 15);

            if (isNearBorder || (colorDist < threshold && distFromCenter > 0.18)) {
              // Replace background pixel with pure white
              data[idx] = 255;
              data[idx + 1] = 255;
              data[idx + 2] = 255;
              data[idx + 3] = 255;
            } else {
              // Subject pixel: track bounding box
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Put modified data back
        ctx.putImageData(imgData, 0, 0);

        // 1. Tight bounding box around detected product to remove excess white margins
        let srcX = 0, srcY = 0, srcW = width, srcH = height;
        if (maxX > minX && maxY > minY) {
          srcX = minX;
          srcY = minY;
          srcW = Math.max(10, maxX - minX);
          srcH = Math.max(10, maxY - minY);
        }

        // 2. Product occupies ALL horizontal space (zero side margins, full width)
        const targetW = 320;
        const targetH = Math.max(120, Math.min(320, Math.round(targetW * (srcH / srcW))));

        const outCanvas = document.createElement('canvas');
        outCanvas.width = targetW;
        outCanvas.height = targetH;
        const outCtx = outCanvas.getContext('2d');

        // Clean white background
        outCtx.fillStyle = '#FFFFFF';
        outCtx.fillRect(0, 0, targetW, targetH);

        // Draw cropped product occupying 100% of horizontal space (drawX = 0, drawW = targetW)
        outCtx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

        // 3. Compress to MAXIMUM of 15 KB (15,360 bytes => ~20,000 base64 chars)
        let quality = 0.80;
        let whiteBgDataUrl = outCanvas.toDataURL('image/jpeg', quality);

        // Reduce quality if needed to strictly stay under 15 KB
        while (whiteBgDataUrl.length > 20000 && quality > 0.25) {
          quality -= 0.08;
          whiteBgDataUrl = outCanvas.toDataURL('image/jpeg', quality);
        }

        // Iteratively downscale canvas dimensions if still over 15 KB
        while (whiteBgDataUrl.length > 20000 && outCanvas.width > 160) {
          const downCanvas = document.createElement('canvas');
          downCanvas.width = Math.round(outCanvas.width * 0.85);
          downCanvas.height = Math.round(outCanvas.height * 0.85);
          const dCtx = downCanvas.getContext('2d');
          dCtx.fillStyle = '#FFFFFF';
          dCtx.fillRect(0, 0, downCanvas.width, downCanvas.height);
          dCtx.drawImage(outCanvas, 0, 0, downCanvas.width, downCanvas.height);
          whiteBgDataUrl = downCanvas.toDataURL('image/jpeg', 0.65);
          outCanvas.width = downCanvas.width;
          outCanvas.height = downCanvas.height;
          outCtx.drawImage(downCanvas, 0, 0);
        }

        resolve(whiteBgDataUrl);
      } catch (err) {
        console.warn('Background removal canvas error, falling back:', err);
        // Fallback to original image if anything fails
        resolve(typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl));
      }
    };

    img.onerror = () => {
      resolve(typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl));
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrUrl);
    }
  });
};


/**
 * Document & Paper Ledger Image Processing
 * - Maximizes horizontal width so bill lines and numbers occupy full space
 * - Sharpens ink contrast for handwriting & receipts
 * - Compresses strictly to a MAXIMUM of 15 KB (never saves to disk/project folder)
 */
export const processDocumentImage = (fileOrUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // Occupy all horizontal space (340px width with proportional height)
        const targetW = 340;
        const targetH = Math.max(160, Math.min(480, Math.round(targetW * (origH / origW))));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Draw document occupying 100% of horizontal space
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, origW, origH, 0, 0, targetW, targetH);

        // Enhance text & ink contrast
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Slight contrast stretch to make faint pen/pencil ink darker and paper whiter
          const contrasted = gray < 135 ? Math.max(0, gray * 0.72) : Math.min(255, gray * 1.08);
          d[i] = contrasted;
          d[i + 1] = contrasted;
          d[i + 2] = contrasted;
        }
        ctx.putImageData(imgData, 0, 0);

        // Compress strictly to <= 15 KB (15,360 bytes => ~20,000 base64 chars)
        let quality = 0.78;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > 20000 && quality > 0.25) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        while (dataUrl.length > 20000 && canvas.width > 160) {
          const downCanvas = document.createElement('canvas');
          downCanvas.width = Math.round(canvas.width * 0.85);
          downCanvas.height = Math.round(canvas.height * 0.85);
          const dCtx = downCanvas.getContext('2d');
          dCtx.fillStyle = '#FFFFFF';
          dCtx.fillRect(0, 0, downCanvas.width, downCanvas.height);
          dCtx.drawImage(canvas, 0, 0, downCanvas.width, downCanvas.height);
          dataUrl = downCanvas.toDataURL('image/jpeg', 0.65);
          canvas.width = downCanvas.width;
          canvas.height = downCanvas.height;
          ctx.drawImage(downCanvas, 0, 0);
        }

        resolve(dataUrl);
      } catch (err) {
        console.warn('Document processing fallback:', err);
        resolve(typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl));
      }
    };

    img.onerror = () => {
      resolve(typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl));
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrUrl);
    }
  });
};
