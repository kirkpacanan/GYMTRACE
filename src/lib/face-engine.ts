"use client";

const MODEL_URI = "/models";

type FaceApi = typeof import("@vladmandic/face-api");

let loading: Promise<FaceApi> | null = null;

export async function loadFaceModels(): Promise<FaceApi> {
  if (!loading) {
    loading = (async () => {
      const faceapi = await import("@vladmandic/face-api/dist/face-api.esm.js");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URI),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI),
      ]);
      return faceapi;
    })().catch((err) => {
      loading = null;
      throw err;
    });
  }
  return loading;
}

export async function startCamera(
  video: HTMLVideoElement,
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser cannot open a camera.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function readOnce(
  faceapi: FaceApi,
  video: HTMLVideoElement,
): Promise<number[] | null> {
  if (video.readyState < 2 || video.videoWidth === 0) return null;
  const detection = await faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.25,
      }),
    )
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor);
}

function averageDescriptors(samples: number[][]): number[] {
  const length = samples[0].length;
  const avg = new Array<number>(length).fill(0);
  for (const sample of samples) {
    for (let i = 0; i < length; i++) avg[i] += sample[i];
  }
  for (let i = 0; i < length; i++) avg[i] /= samples.length;
  let norm = 0;
  for (const value of avg) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  return avg.map((value) => value / norm);
}

/** Grab one or more face embeddings from a live camera frame. */
export async function captureDescriptor(
  video: HTMLVideoElement,
  options?: { samples?: number; timeoutMs?: number },
): Promise<number[]> {
  const samplesNeeded = options?.samples ?? 1;
  const timeoutMs = options?.timeoutMs ?? 5000;
  const faceapi = await loadFaceModels();
  const collected: number[][] = [];
  const deadline = Date.now() + timeoutMs;

  while (collected.length < samplesNeeded && Date.now() < deadline) {
    const descriptor = await readOnce(faceapi, video);
    if (descriptor) collected.push(descriptor);
    await new Promise((resolve) => setTimeout(resolve, 160));
  }

  if (collected.length === 0) {
    throw new Error("No face detected. Look at the camera and try again.");
  }
  return averageDescriptors(collected);
}
