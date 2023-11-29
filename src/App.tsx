import { useRef, useState } from "react"
import { SelectMediaDevicesModal } from "react-select-media-devices-modal"
import "./App.css"
import "react-select-media-devices-modal/dist/style.css"
import Webcam from "react-webcam"
import { VirtualBackgroundProcessor } from "@shiguredo/virtual-background"
import {
  LightAdjustmentGpuProcessor,
  llieModelNames,
} from "@shiguredo/light-adjustment-gpu/dist/light_adjustment_gpu"
// import { LightAdjustmentProcessor } from "@shiguredo/light-adjustment"

const blurAssetsPath =
  "https://cdn.jsdelivr.net/npm/@shiguredo/virtual-background@latest/dist"
const blurProcessor = new VirtualBackgroundProcessor(blurAssetsPath)
const adjAssetsPath =
  "https://cdn.jsdelivr.net/npm/@shiguredo/light-adjustment-gpu@latest/dist"
const adjModel = llieModelNames.semanticGuidedLlie1284x720 // モデル（処理する解像度）の指定
const strength = 0.5 // 明るさの調整度合い
const adjProcessor = new LightAdjustmentGpuProcessor(
  adjAssetsPath,
  adjModel,
  strength
)
const image = new Image()
image.src = "/takenoko.png"

// const adjProcessor = new LightAdjustmentProcessor()

function App() {
  const [deviceId, setDeviceId] = useState("default")
  const [modalOpen, setModalOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const handleDeviceSelected = (devices: {
    audioInput?: MediaDeviceInfo | undefined
    audioOutput?: MediaDeviceInfo | undefined
    videoInput?: MediaDeviceInfo | undefined
  }) => {
    setModalOpen(false)
    console.log(devices)
    if (devices.videoInput) {
      setDeviceId(devices.videoInput.deviceId)
    }
  }
  const handleDeviceSelectCanceld = () => {
    setModalOpen(false)
  }
  const handleUserMedia = async (stream: MediaStream) => {
    if (videoRef.current) {
      const track = stream.getVideoTracks()[0]
      blurProcessor.stopProcessing()
      // 型定義がおかしいので一旦anyで回避
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(adjProcessor as any).stopProcessing()
      blurProcessor
        .startProcessing(track, { backgroundImage: image })
        .then((newTrack) => {
          // 型定義がおかしいので一旦anyで回避
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-extra-semi
          ;(adjProcessor as any)
            .startProcessing(newTrack)
            .then((newTrack: MediaStreamTrack) => {
              if (videoRef.current) {
                const newStream = new MediaStream([newTrack])
                videoRef.current.srcObject = newStream
              }
            })
        })
    }
  }

  return (
    <div>
      <div>
        <Webcam
          audio={false}
          mirrored={false}
          videoConstraints={{
            deviceId: deviceId,
          }}
          onUserMedia={handleUserMedia}
        />
        <video autoPlay={true} ref={videoRef} />
      </div>
      <div>
        <button onClick={() => setModalOpen((current: boolean) => !current)}>
          Select Device
        </button>
      </div>
      <div>
        <SelectMediaDevicesModal
          isSelectAudioInput={false}
          isSelectAudioOutput={false}
          isSelectVideoInput={true}
          open={modalOpen}
          onDeviceSelected={handleDeviceSelected}
          onDeviceSelectCanceled={handleDeviceSelectCanceld}
        />
      </div>
    </div>
  )
}

export default App
