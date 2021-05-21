/*************************
 * Preview
 *************************/
export class MoulinettePreview extends FormApplication {
  
  constructor(asset, pack) {
    super()
    this.asset = asset;   
    this.pack = pack;
  }
  
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "moulinette-preview",
      classes: ["mtte", "forge", "preview"],
      title: game.i18n.localize("mtte.preview"),
      template: "modules/moulinette-scenes/templates/preview.hbs",
      width: 420,
      height: 600,
      closeOnSubmit: false,
      submitOnClose: false,
    });
  }
  
  async getData() { 
    return { asset: this.asset, pack: this.pack }
  }

  activateListeners(html) {
    super.activateListeners(html);
    this.bringToTop()
    
    html.find("button").click(this._onClick.bind(this))
  }
  
  /*************************************
   * Main action
   ************************************/
  async _onClick(event) {
    event.preventDefault();
    
    ui.scenes.activate() // give focus to scenes
    try {
      // retrieve scene JSON
      const response = await fetch(`${this.pack.path}/${this.asset.filename}${this.asset.sas}`).catch(function(e) {
        console.log(`Moulinette | Not able to fetch scene JSON`, e)
      });
      if(!response) return ui.notifications.error(game.i18n.localize("mtte.forgingFailure"), 'error');
      
      // prepare source & target URL
      const publisherPath = game.moulinette.applications.MoulinetteFileUtil.generatePathFromName(this.pack.publisher)
      const packPath = game.moulinette.applications.MoulinetteFileUtil.generatePathFromName(this.pack.name)
      const targetPath = `moulinette/scenes/${publisherPath}/${packPath}/`
      
      // download all dependencies
      await game.moulinette.applications.MoulinetteFileUtil.downloadAssetDependencies(this.asset.data.deps, this.pack.path + "/", this.asset.sas, targetPath)
      
      // replace all DEPS
      const jsonAsText = await response.text()
      const scene = JSON.parse( jsonAsText.replace(new RegExp("#DEP#", "g"), targetPath) )
      
      // adapt scene and create
      let newScene = await Scene.create(scene);
      let tData = await newScene.createThumbnail()
      await newScene.update({thumb: tData.thumb}); // force generating the thumbnail
      
      ui.notifications.info(game.i18n.localize("mtte.forgingSuccess"), 'success')
      this.close()
    } catch(e) {
      console.log(`Moulinette | Unhandled exception`, e)
      ui.notifications.error(game.i18n.localize("mtte.forgingFailure"), 'error')
    }
  }
}
