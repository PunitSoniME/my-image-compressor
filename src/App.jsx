import React, { Component } from 'react';
import Header from './components/header/header';
import Compressor from 'compressorjs';
import './App.css';
import * as JSZip from 'jszip';
import saveAs from './Filesaver';

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      files: null
    };
  }

  componentDidMount() {

    let dropContainer = document.getElementById("dropContainer");

    dropContainer.ondragover = dropContainer.ondragenter = (evt) => {
      evt.preventDefault();
    };

    dropContainer.ondrop = (evt) => {
      const dT = new DataTransfer();

      for (let index = 0; index < evt.dataTransfer.files.length; index++) {
        dT.items.add(evt.dataTransfer.files[index]);
      }

      evt.preventDefault();

      this.startCompression(dT.files);
    };

  }

  startCompression = (files) => {

    let newFiles = [];

    if (files.length > 0) {

      for (let index = 0; index < files.length; index++) {
        newFiles.push({
          name: files[index].name,
          originalFile: files[index],
          originalFileSize: files[index].size,
          originalFileSizeInKB: null,
          compressedFile: null,
          compressedFileSize: null,
          compressedFileSizeInKB: null,
          isCompleted: false,
          fileSizeDifference: null
        })
      }

      this.setState({ files: newFiles });

      setTimeout(() => {
        window.scroll({
          top: screen.height,
          behavior: 'smooth'
        });
      }, 100);

      for (let index = 0; index < newFiles.length; index++) {
        const imageFile = newFiles[index].originalFile;

        new Promise((resolve, reject) => {
          new Compressor(imageFile, {
            quality: 0.6,
            success: resolve,
            error: reject
          })
        }).then((compressedFile) => {
          const fileReaderInstance = new FileReader();
          fileReaderInstance.readAsDataURL(compressedFile);

          fileReaderInstance.onload = () => {
            let base64data = fileReaderInstance.result;

            newFiles[index].originalFileSizeInKB = this.getFileSizeInKB(files[index].size) + " KB";

            newFiles[index].compressedFile = base64data;
            newFiles[index].compressedFileSize = compressedFile.size;
            newFiles[index].compressedFileSizeInKB = this.getFileSizeInKB(compressedFile.size) + " KB";

            newFiles[index].fileSizeDifference = "- " + (100 - ((compressedFile.size / files[index].size) * 100)).toFixed(2) + " %";

            newFiles[index].isCompleted = true;

            setTimeout(() => {
              this.setState({
                files: newFiles
              });

            }, 1000);

          }
        }).catch((error) => {
          console.danger("Compression Error: ", error.message);
        });
      }
    }

  }

  handleImageUpload = (event) => {
    this.startCompression(event.target.files);
  }

  getFileSizeInKB = (sizeInBytes) => {
    return (sizeInBytes / 1024).toFixed(2);
  }

  downloadZip = () => {
    let zip = new JSZip();
    let img = zip.folder("compressed-images");

    let files = this.state.files;

    for (let index = 0; index < files.length; index++) {
      let file = files[index];
      img.file(file.name, file.compressedFile);
    }

    zip.generateAsync({ type: "blob" })
      .then((content) => {
        saveAs(content, "compressed-images.zip");
      });
  }

  render() {

    return (
      <>
        <Header />

        <main>

          <label className="drop-container-outer" id="dropContainer">

            <div className="drop-container-middle">

              <div className="file">
                <input type="file" id="file" aria-label="File browser example" multiple={true} onChange={this.handleImageUpload} />

                <i className='bx bx-image-add image-upload-icon'></i>

                <h1 className="file-custom">
                  Select Or Drop Files Here
                </h1>
              </div>

            </div>

          </label>

          <div className={this.state.files ? 'download-compressed-image-outer' : ''}>
            <div className={this.state.files ? 'download-compressed-image-inner' : ''}>
              {
                this.state.files ?
                  this.state.files.map((file, index) => (
                    <>

                      <div className="row">

                        <div className="col col-file-name">
                          {file.name}
                        </div>

                        <div className="col text-center hide-sm hide-xs size-text flex-center">
                          {file.originalFileSizeInKB}
                        </div>

                        <div className="col text-center">
                          {
                            !file.isCompleted ?
                              <span className='proessing-text'>
                                Processing...
                              </span> : ''
                          }
                          {
                            file.isCompleted ?
                              <a className='complete-text' href={file.compressedFile} download={file.name}>
                                Download
                              </a> : ''
                          }

                        </div>

                        <div className="col hide-sm hide-xs size-text flex-center">
                          {file.compressedFileSizeInKB}
                        </div>

                        <div className="col text-center">
                          {file.fileSizeDifference}
                        </div>

                      </div>

                    </>
                  )) : ''
              }


              {
                this.state.files ?
                  <button type="button" className="btn" onClick={this.downloadZip}>Download Zip</button> : ''
              }

            </div>
          </div>

        </main>
      </>
    );
  }
}

export default App;
