/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */
//*Developer:- Praveen Singh Rathore

import React, { Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import { RNCamera } from 'react-native-camera';
import RNVideoHelper from 'react-native-video-helper';
import RNThumbnail from 'react-native-thumbnail';
import Video from 'react-native-video';
import ImagePicker from 'react-native-image-picker';
import RadioGroup from 'react-native-radio-buttons-group';
import RNFS from 'react-native-fs';

class App extends Component {
  constructor(props) {
    super(props);
    this.camera = React.createRef();

    this.state = {
      captureVideo: false,
      playVideo: false,
      isRecording: false,
      thumbnailURL: '',
      videoURL: '',
      compressedVideoURL: '',
      loading: false,
      progress: 0,
      radioButtonData: [
        {
          label: 'Compressed Video',
          value: 'Compressed',
          selected: true,
        },
        {
          label: 'Original Video',
          value: 'Original',
        },
      ],
    };
  }

  render() {
    return (
      <SafeAreaView
        style={{
          flex: 1,
        }}>
        <View style={styles.container}>
          {this.state.playVideo ? (
            <Video
              source={{
                uri:
                  this.state.radioButtonData.find(e => e.selected == true)
                    .value === 'Compressed'
                    ? this.state.compressedVideoURL
                    : this.state.videoURL,
              }}
              style={styles.video}
              poster={this.state.thumbnail}
              fullscreen={true}
              resizeMode="contain"
              controls={true}
              onEnd={() => this.setState({ playVideo: false })}
            />
          ) : this.state.loading ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text>{Math.floor(this.state.progress * 100)}%</Text>
              <Text> Please wait while compressing video </Text>
            </View>
          ) : this.state.captureVideo ? (
            <RNCamera
              ref={cam => {
                this.camera = cam;
              }}
              style={styles.preview}
              keepAwake={true}>
              <View
                style={{
                  width: '100%',
                  position: 'absolute',
                  alignItems: 'center',
                  bottom: 20,
                }}>
                {this.state.isRecording ? (
                  <Text
                    style={{
                      padding: 10,
                      backgroundColor: 'red',
                      color: 'white',
                    }}
                    onPress={()=>this.stopVid.bind(this)}>
                    Stop recording
                  </Text>
                ) : (
                    <Text
                      style={{
                        padding: 10,
                        backgroundColor: '#ffffff',
                        color: '#000000',
                      }}
                      onPress={()=>this.takeVid.bind(this)}>
                      Start recording
                  </Text>
                  )}
              </View>
            </RNCamera>
          ) : (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {this.state.thumbnail ? (
                      <>
                        <Image
                          style={{ width: 300, height: 300 }}
                          source={{
                            uri: this.state.thumbnail,
                          }}
                        />
                      </>
                    ) : null}
                    <View>
                      {this.state.compressedVideoURL ? (
                        <View
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: 10,
                          }}>
                          <RadioGroup
                            radioButtons={this.state.radioButtonData}
                            onPress={(radioButtonData) =>
                              this.setState({ radioButtonData })
                            }
                          />
                          <TouchableOpacity
                            style={{
                              backgroundColor: this.state.playVideo ? 'red' : 'white',
                              padding: 10,
                              elevation: 10,
                              margin: 5,
                              width: 100,
                            }}
                            onPress={() =>
                              this.setState({ playVideo: !this.state.playVideo })
                            }>
                            {this.state.playVideo ? (
                              <Text style={{ color: 'white' }}> Stop Video </Text>
                            ) : (
                                <Text style={{ color: 'black' }}> Play Video </Text>
                              )}
                          </TouchableOpacity>
                        </View>
                      ) : null}
                      <View
                        style={{
                          flexDirection: 'row',
                          margin: 10,
                        }}>
                        <TouchableOpacity
                          style={{
                            backgroundColor: 'white',
                            padding: 10,
                            elevation: 10,
                            margin: 5,
                          }}
                          onPress={() => this.setState({ captureVideo: true })}>
                          <Text> Capture Video </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            backgroundColor: 'white',
                            padding: 10,
                            elevation: 10,
                            margin: 5,
                          }}
                          onPress={() => this.videoPicker()}>
                          <Text> Choose From Gallery </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
        </View>
      </SafeAreaView>
    );
  }

  takeVid() {
    if (this.camera) {
      this.setState({ isRecording: true });
      this.camera
        .recordAsync()
        .then(data => {
          console.warn(JSON.stringify(data))
          this.processingVid(data.uri)
        }
        )
        .catch(err => console.error(err));
    }
  }

  stopVid() {
    if (this.camera) {
      this.setState({ isRecording: false });
      this.camera.stopRecording();
    }
  }

  async processingVid(url) {
    this.setState({ captureVideo: false, videoURL: url, loading: true });

    Promise.all([this.createThumbnail(url), this.compressVideo(url)])
      .then(() => {
        this.setState({ loading: false, progress: 0 });
      })
      .catch(error => {
        this.setState({ loading: false });
        console.error(error);
      });
  }

  compressVideo(source) {
    return new Promise((resolve, reject) => {
      try {
        RNVideoHelper.compress(source, {
          quality: "low", // default low, can be medium or high
          startTime: 0, // optional, in seconds, defaults to 0
          endTime: 60 * 60 // Max 1 hr
        })
          .progress(value => {
            this.setState({ progress: value });
          })
          .then(compressedUri => {
            this.setState({ compressedVideoURL: compressedUri });

            console.warn(JSON.stringify(compressedUri))
            //Genrate random number
            const min = 1;
            const max = 1000;
            const random = min + (Math.random() * (max - min));
            if (Platform.OS === 'android') {
              RNFS.copyFile(compressedUri, `${RNFS.ExternalDirectoryPath}/MyVideos_${random}.mp4`)
                .then(data => {
                  console.warn('move success')
                })
                .catch(message => {
                  console.warn('error move file', message)
                })

            } else {
              
            }
            resolve();
          });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }

  async videoPicker() {
    try {
      if (Platform.OS === 'android') {
        await this.isPermissionGrantedOnAndroid(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Media Library Permission',
            message: 'App needs the permission to access your camera storage',
          },
        );

        await this.isPermissionGrantedOnAndroid(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Media Library Permission',
            message: 'App needs the permission to access your camera storage',
          },
        );
      }
    } catch (error) {
      console.error(error);
    }
    const options = {
      title: 'Choose Video',
      mediaType: 'video',
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled video picker');
      } else if (response.error) {
        console.log('Video picker Error: ', response.error);
      } else {
        let url = '';

        console.warn(JSON.stringify(response))

        if (Platform.OS === 'android') {
          url = response.path;
        } else {
          url = response.uri;
        }
        this.setState({ videoURL: url });
        this.processingVid(url);
      }
    });
  }

  async createThumbnail(source) {
    try {
      if (Platform.OS === 'android') {
        await this.isPermissionGrantedOnAndroid(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Media Library Permission',
            message: 'App needs the permission to access your camera storage',
          },
        );

        await this.isPermissionGrantedOnAndroid(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Media Library Permission',
            message: 'App needs the permission to access your camera storage',
          },
        );
      }

      const result = await RNThumbnail.get(source);

      this.setState({ thumbnail: result.path });
    } catch (error) {
      console.error(error);
    }
  }

  async isPermissionGrantedOnAndroid(permission, dialog) {
    const status = await PermissionsAndroid.request(permission, {
      title: dialog.title,
      message: dialog.title,
      buttonNeutral: dialog.buttonNeutral || 'Ask Me Later',
      buttonNegative: dialog.buttonNegative || "Don't allow",
      buttonPositive: dialog.buttonPositive || 'OK',
    });

    return status === PermissionsAndroid.RESULTS.GRANTED;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#eeeeee'
  },
  preview: {
    flex: 1,
    justifyContent: 'space-between',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

export default App;
