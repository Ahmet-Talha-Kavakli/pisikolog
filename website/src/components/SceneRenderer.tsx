"use client";

import { useFrame } from "@react-three/fiber";
import { ScrollControls, useScroll } from "@react-three/drei";
import MainCanvas from "@/components/canvas/MainCanvas";
import { CameraRig } from "@/components/canvas/CameraRig";
import GlobalStarfield from "@/components/canvas/GlobalStarfield";

import S01_BigBang from "@/components/scenes/S01_BigBang";
import S02_GalaxyFormation from "@/components/scenes/S02_GalaxyFormation";
import S03_MilkyWayApproach from "@/components/scenes/S03_MilkyWayApproach";
import S04_MilkyWayTour from "@/components/scenes/S04_MilkyWayTour";
import S05_SolarSystemDive from "@/components/scenes/S05_SolarSystemDive";
import S06_EarthApproach from "@/components/scenes/S06_EarthApproach";
import S07_CountryDescent from "@/components/scenes/S07_CountryDescent";
import S08_CityZoom from "@/components/scenes/S08_CityZoom";
import S09_DistrictApproach from "@/components/scenes/S09_DistrictApproach";
import S10_SingleHouse from "@/components/scenes/S10_SingleHouse";
import S11_RoomInterior from "@/components/scenes/S11_RoomInterior";
import S13_LyraEnvironment from "@/components/scenes/S13_LyraEnvironment";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { Howl } from "howler";
import { useEffect, useState } from "react";

function OverlaySync() {
  const scroll = useScroll();
  useFrame(() => {
    const overlay = document.getElementById("hero-overlay");
    if (overlay) {
      const opacity = Math.max(0, 1 - scroll.offset * 20);
      overlay.style.opacity = opacity.toString();
      overlay.style.display = opacity === 0 ? "none" : "flex";
    }
  });
  return null;
}

const AMBIENT_URL = "https://cdn.pixabay.com/download/audio/2022/03/24/audio_b2002f23b1.mp3?filename=deep-space-ambient-11001.mp3"; 

export default function SceneRenderer() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let sound: Howl | null = null;
    if (started) {
      sound = new Howl({
        src: [AMBIENT_URL],
        loop: true,
        volume: 0.15,
        html5: true,
        format: ['mp3']
      });
      sound.play();
    }
    return () => {
      if (sound) {
        sound.stop();
        sound.unload();
      }
    };
  }, [started]);

  return (
    <div className="w-full h-full bg-black">
      <LoadingScreen onStarted={() => setStarted(true)} />
      <MainCanvas>
        <ScrollControls pages={40} damping={0.4} distance={1}>
          <CameraRig />
          <OverlaySync />
          <GlobalStarfield />
          <S01_BigBang />
          <S02_GalaxyFormation />
          <S03_MilkyWayApproach />
          <S04_MilkyWayTour />
          <S05_SolarSystemDive />
          <S06_EarthApproach />
          <S07_CountryDescent />
          <S08_CityZoom />
          <S09_DistrictApproach />
          <S10_SingleHouse />
          <S11_RoomInterior />
          <S13_LyraEnvironment />
        </ScrollControls>
      </MainCanvas>
    </div>
  );
}
