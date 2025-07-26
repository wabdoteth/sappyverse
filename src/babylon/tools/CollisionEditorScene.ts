import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import '@babylonjs/materials/grid';
import { CollisionEditor } from './CollisionEditor';

export class CollisionEditorScene {
    private editor: CollisionEditor;
    public camera: UniversalCamera;
    public materials: { [key: string]: StandardMaterial } = {};
    
    constructor(editor: CollisionEditor) {
        this.editor = editor;
    }
    
    public setupScene(): void {
        const scene = this.editor.scene;
        scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);
        
        // Camera
        this.camera = new UniversalCamera('camera', new Vector3(0, 10, -20), scene);
        this.camera.setTarget(Vector3.Zero());
        this.camera.attachControl(this.editor.canvas, true);
        
        // Disable default keyboard controls to use our own WASD
        this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
        
        // Lights
        new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
        new DirectionalLight('light2', new Vector3(-1, -2, 1), scene);
        
        // Ground grid
        const ground = CreateGround('ground', { width: 50, height: 50 }, scene);
        const gridMat = new GridMaterial('gridMat', scene);
        gridMat.majorUnitFrequency = 5;
        gridMat.minorUnitVisibility = 0.45;
        ground.material = gridMat;
        ground.isPickable = false; // Make ground unselectable
        
        // Origin marker
        this.createOriginMarker();
    }
    
    private createOriginMarker(): void {
        const scene = this.editor.scene;
        
        // Sphere marker
        const originMarker = CreateSphere('originMarker', { diameter: 0.5, segments: 16 }, scene);
        originMarker.position = new Vector3(0, 0.25, 0);
        const originMat = new StandardMaterial('originMat', scene);
        originMat.emissiveColor = new Color3(0, 1, 0);
        originMat.disableLighting = true;
        originMat.alpha = 0.5;
        originMarker.material = originMat;
        originMarker.isPickable = false;
        
        // Label
        const originPlane = CreatePlane('originLabel', { width: 2, height: 0.5 }, scene);
        originPlane.position = new Vector3(0, 1, 0);
        originPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
        const originTexture = new DynamicTexture('originTexture', { width: 256, height: 64 }, scene);
        const ctx = originTexture.getContext();
        ctx.font = '32px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Origin (0,0,0)', 128, 40);
        originTexture.update();
        const originLabelMat = new StandardMaterial('originLabelMat', scene);
        originLabelMat.diffuseTexture = originTexture;
        originLabelMat.emissiveColor = new Color3(1, 1, 1);
        originLabelMat.disableLighting = true;
        originLabelMat.backFaceCulling = false;
        originPlane.material = originLabelMat;
        originPlane.isPickable = false;
    }
    
    public createMaterials(): void {
        this.materials = {
            wall: this.createMaterial('wall', new Color3(1, 0, 0)),      // Red - same as box
            box: this.createMaterial('box', new Color3(1, 0, 0)),        // Red
            cylinder: this.createMaterial('cylinder', new Color3(0, 1, 0)), // Green
            floor: this.createMaterial('floor', new Color3(0, 0, 1)),    // Blue
            ramp: this.createMaterial('ramp', new Color3(1, 0, 1)),      // Magenta
            selected: this.createMaterial('selected', new Color3(1, 1, 0)) // Yellow
        };
    }
    
    private createMaterial(name: string, color: Color3): StandardMaterial {
        const mat = new StandardMaterial(name + 'Mat_' + Date.now(), this.editor.scene);
        mat.wireframe = true;
        mat.emissiveColor = color;
        mat.disableLighting = true;
        mat.alpha = 0.5;
        mat.backFaceCulling = false;
        return mat;
    }
    
    public createColliderMesh(type: string, position: Vector3): Mesh | null {
        let mesh: Mesh | null = null;
        const scene = this.editor.scene;
        
        switch (type) {
            case 'box':
                mesh = CreateBox('wall_' + Date.now(), { size: 2 }, scene);
                mesh.material = this.materials.box;
                break;
            case 'cylinder':
                mesh = CreateCylinder('cyl_' + Date.now(), { diameter: 2, height: 3 }, scene);
                mesh.material = this.materials.cylinder;
                break;
            case 'floor':
                mesh = CreateBox('floor_' + Date.now(), { width: 4, height: 0.2, depth: 4 }, scene);
                mesh.material = this.materials.floor;
                break;
            case 'ramp':
                mesh = CreateBox('ramp_' + Date.now(), { width: 4, height: 0.2, depth: 4 }, scene);
                mesh.material = this.materials.ramp;
                mesh.rotation.x = Math.PI / 6;
                break;
        }
        
        if (mesh) {
            mesh.position = position;
        }
        
        return mesh;
    }
    
    public flashOriginMarker(): void {
        const originMarker = this.editor.scene.getMeshByName('originMarker');
        if (originMarker && originMarker.material) {
            const mat = originMarker.material as StandardMaterial;
            const originalColor = mat.emissiveColor.clone();
            mat.emissiveColor = new Color3(1, 1, 0); // Yellow flash
            setTimeout(() => {
                mat.emissiveColor = originalColor;
            }, 200);
        }
    }
}