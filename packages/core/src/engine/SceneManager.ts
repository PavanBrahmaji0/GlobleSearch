import * as Cesium from 'cesium';

export type SceneMode = 'globe' | 'morphing' | 'map';

export class SceneManager {
  private viewer: Cesium.Viewer;
  private _mode: SceneMode = 'globe';

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  get mode(): SceneMode {
    return this._mode;
  }

  async morphToMap(duration = 2000): Promise<void> {
    if (this._mode === 'map') return;
    this._mode = 'morphing';
    return new Promise(resolve => {
      this.viewer.scene.morphTo2D(duration / 1000);
      setTimeout(() => {
        this._mode = 'map';
        resolve();
      }, duration + 100);
    });
  }

  async morphToGlobe(duration = 2000): Promise<void> {
    if (this._mode === 'globe') return;
    this._mode = 'morphing';
    return new Promise(resolve => {
      this.viewer.scene.morphTo3D(duration / 1000);
      setTimeout(() => {
        this._mode = 'globe';
        resolve();
      }, duration + 100);
    });
  }
}
