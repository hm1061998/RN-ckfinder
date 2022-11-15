import React, {
  forwardRef,
  useEffect,
  useRef,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Modal,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
  FlatList,
  RefreshControl,
} from "react-native";
// import axios from 'axios';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import {
  FontAwesome5,
  FontAwesome,
  MaterialIcons,
  Ionicons,
  Feather,
  Foundation,
  AntDesign,
} from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";
import TreeItem from "./TreeItem";
import { SvgUri, formatBytes, getInterpolate } from "../utils";
import MultipleImagePicker from "@baronha/react-native-multiple-image-picker";
import ModalAddFolder from "./ModalAddFolder";
import ProgressBar from "./ProgressBar";
import color from "../utils/color";

const Ckfinder = ({}, ref) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [totalCountUpload, setTotalCountUpload] = useState(0);
  const [countUploaded, setCountUploaded] = useState(0);
  const [countUploadFailed, setCountUploadFailed] = useState(0);
  const [filesSelected, setFilesSelected] = useState([]);
  const anim = useSharedValue(0);
  const addFolderRef = useRef();

  const [state, setState] = useState({
    chooseFiles: false,
    connectorInfo: `token=${""}&root=${"rbms"}&domain=${"rbmscms.vgasoft.vn"}&OriginServer=${"rbmscms.vgasoft.vn"}`,
    connectorPath:
      "http://ckfinder.nhathuocgpp.com.vn/core/connector/php/connector.php",
    startupPath: `Images:/${dayjs().format("YYYYMMDD")}/`,
    onInit: () => true,
  });

  const [ckFinderData, setCkFinderData] = useState(null);
  const [filesData, setFilesData] = useState(null);
  const [folderActiveName, setFolderActiveName] = useState(null);

  useImperativeHandle(ref, () => ({
    show: (rec) => {
      setState((prev) => ({ ...prev, ...rec }));
      setVisible(true);
    },
  }));

  useEffect(() => {
    if (visible) {
      handleInit();
    }
  }, [handleInit, visible]);

  useEffect(() => {
    if (!visible) {
      closeFolderList();
      setFilesSelected([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleInit = useCallback(async () => {
    const { connectorInfo, connectorPath } = state;

    const url = `${connectorPath}?command=Init&${connectorInfo}`;
    // console.log({ url });
    setIsLoading(true);
    try {
      const result = await fetch(url).then((res) => res.json());
      setIsLoading(false);
      const response = result;

      setCkFinderData(response);
    } catch (e) {
      setIsLoading(false);
      // console.log({ e });
    }
  }, [state]);

  const handleGetFiles = useCallback(
    async (name, type) => {
      const { connectorInfo, connectorPath } = state;
      setFolderActiveName(`${type}/${name}`);

      const url = `${connectorPath}?command=GetFiles&type=${type}&currentFolder=${name}&${connectorInfo}`;
      setIsLoadingFiles(true);
      try {
        const result = await fetch(url).then((res) => res.json());
        setIsLoadingFiles(false);
        const response = result;

        setFilesData(response);
      } catch (e) {
        setIsLoadingFiles(false);
      }
    },
    [state]
  );

  const openPicker = async () => {
    try {
      const options = {
        usedCameraButton: true,
        singleSelectedMode: false,
        doneTitle: "Xong",
        cancelTitle: "Hủy",
        maximumMessageTitle: "Thông báo",
        tapHereToChange: "Chạm vào đây để thay đổi",
        maximumMessage: "Bạn đã chọn số lượng phương tiện tối đa được phép",
        isPreview: false,
        // maxSelectedAssets: isCheckSelected
        //   ? maxLength
        //   : maxLength - dataListImage.length,
        mediaType: "image",
      };

      const response = await MultipleImagePicker.openPicker(options);
      saveListImage(response);
    } catch (e) {
      console.log("err", e);
      if (Platform.OS === "ios") {
        setVisible(false);
      }
    }
  };

  const saveListImage = async (rec) => {
    if (rec?.length > 0) {
      let listImg = await Promise.all(
        rec.map(async (item, _index) => {
          const check = item.path?.match(/:/);
          let uriImage = item.path;
          if (!check) {
            uriImage = `file://${uriImage}`;
          }

          const newItem = {
            id: `${new Date().getTime() + _index}`,
            localIdentifier: item.localIdentifier,
            status: "uploading",
            path: uriImage,
            name: item.fileName,
            type: item.mime,
          };

          return newItem;
        })
      );

      onUpload(listImg);
    }
  };

  const onUpload = async (arr) => {
    // console.log('run', folderActiveName);
    setTotalCountUpload(arr.length);
    setUploading(true);
    const response = await new Promise.all(arr.map((e) => uploadImage(e)));
    setTimeout(() => {
      setUploading(false);
      setCountUploaded(0);
      setTotalCountUpload(0);
      setCountUploadFailed(0);
    }, 2000);
    const path = folderActiveName.split("/");
    const type = path[0];
    const currentFolder = path[1];
    handleGetFiles(currentFolder, type);
  };

  const createFormData = (photo, body = {}) => {
    const data = new FormData();
    data.append("upload", {
      name: photo.name,
      type: photo.type,
      uri:
        Platform.OS === "ios" ? photo.path.replace("file://", "") : photo.path,
    });

    Object.keys(body).forEach((key) => {
      data.append(key, body[key]);
    });

    return data;
  };

  const uploadImage = async (file) => {
    const { connectorInfo, connectorPath } = state;

    const path = folderActiveName.split("/");
    const type = path[0];
    const currentFolder = path[1];

    const url = `${connectorPath}?command=FileUpload&type=${type}&currentFolder=/${currentFolder}/&responseType=json&${connectorInfo}`;
    const fd = createFormData(file);
    // fd.append('file', file);
    const options = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      method: "POST",
      body: fd,
    };

    try {
      const response = await fetch(url, options).then((_response) => {
        return _response.json();
      });
      // console.log('upload', response);
      if (response?.fileName) {
        setCountUploaded((prev) => prev + 1);
      } else {
        setCountUploadFailed((prev) => prev + 1);
      }
    } catch (e) {}
  };

  const handleSelectFile = (file) => {
    const getFileIndex = filesSelected.findIndex(
      (item) => item.name === file.name
    );
    if (getFileIndex !== -1) {
      setFilesSelected((prev) =>
        prev.filter((item) => item.name !== file.name)
      );
    } else {
      setFilesSelected((prev) => [...prev, file]);
    }
  };

  const toogleFolderList = () => {
    anim.value = withTiming(
      anim.value === 0 ? 1 : 0,
      {
        useNativeDriver: true,
        duration: 300,
      },
      (finished) => {
        // runOnJS(wrapper)(finished);
      }
    );
  };

  const closeFolderList = () => {
    anim.value = withTiming(
      0,
      {
        useNativeDriver: true,
        duration: 300,
      },
      (finished) => {
        // runOnJS(wrapper)(finished);
      }
    );
  };

  const mainStyleAnimated = useAnimatedStyle(() => {
    const translateX = interpolate(anim.value, [0, 1], [-width + 80, 0], {
      extrapolate: Extrapolation.CLAMP,
    });
    return {
      transform: [
        {
          translateX,
        },
      ],
    };
  });

  const { startupPath } = state;

  const path = startupPath.split(":");
  const type = path[0];

  // return null;
  return (
    <Modal
      visible={visible}
      onRequestClose={() => setVisible(false)}
      animationType="slide"
      statusBarTranslucent
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => setVisible(false)}>
            <Ionicons name="close" size={24} color={color.theme} />
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          <TouchableOpacity onPress={toogleFolderList} style={styles.headerBtn}>
            <Feather name="menu" size={24} color={color.theme} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openPicker} style={styles.headerBtn}>
            <MaterialIcons name="file-upload" size={24} color={color.theme} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => addFolderRef.current.show()}
            style={styles.headerBtn}
          >
            <Foundation name="folder-add" size={24} color={color.theme} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator color={"green"} size={"small"} />
          ) : (
            <Animated.View
              style={[
                styles.wrapper,
                { width: width * 2 - 80 },
                mainStyleAnimated,
              ]}
            >
              <View
                style={[
                  styles.listFolder,
                  {
                    width: width - 80,
                  },
                ]}
              >
                <FlatList
                  keyExtractor={(item, index) => `${item.name}-${index}`}
                  data={ckFinderData?.resourceTypes || []}
                  renderItem={({ item }) => (
                    <TreeItem
                      data={item}
                      level={0}
                      state={state}
                      defaultExpanded={type === item.name}
                      handleGetFiles={handleGetFiles}
                      folderActiveName={folderActiveName}
                      resourceType={item.name}
                      currentFolder={"/"}
                    />
                  )}
                />
              </View>
              <View style={[styles.listFile, { width, height: "100%" }]}>
                {uploading && (
                  <View
                    style={{
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      backgroundColor: "green",
                    }}
                  >
                    <Text style={{ color: "#fff" }}>Tải lên hoàn tất</Text>
                    <Text style={{ color: "#fff" }}>
                      Số tập tin được tải lên thành công {countUploaded}/
                      {totalCountUpload}
                    </Text>
                    {countUploadFailed > 0 && (
                      <Text style={{ color: "#fff" }}>
                        Số tập tin tải lên không thành công {countUploaded}
                      </Text>
                    )}
                    <View style={{ marginTop: 10 }}>
                      <ProgressBar
                        width={250}
                        color={"blue"}
                        progress={getInterpolate(
                          countUploaded,
                          0,
                          totalCountUpload,
                          0,
                          1
                        )}
                      />
                    </View>
                  </View>
                )}
                {filesData?.files?.length > 0 ? (
                  <FlatList
                    keyExtractor={(item, index) => `${item.name}-${index}`}
                    data={filesData?.files || []}
                    contentContainerStyle={{ paddingBottom: 50 }}
                    renderItem={({ item }) => {
                      const svg = ["svg", "SVG"];
                      const typeOfImage = item.name.split(".").pop();
                      const checkSvg = svg.indexOf(typeOfImage || "") !== -1;

                      let uri = `${filesData?.currentFolder?.url}${item.name}`;

                      const checked =
                        filesSelected.findIndex((e) => e.name === item.name) !==
                        -1;
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            closeFolderList();
                            handleSelectFile({ ...item, uri });
                          }}
                          key={item.name}
                          style={[styles.item, checked && styles.itemActive]}
                        >
                          {checkSvg ? (
                            <View style={styles.svgWrapper}>
                              <SvgUri uri={uri} width="60" height="60" />
                            </View>
                          ) : (
                            <Image
                              source={{ uri }}
                              style={styles.imageItem}
                              resizeMode="contain"
                            />
                          )}

                          <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={{ fontWeight: "600", fontSize: 15 }}>
                              {item.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: "gray" }}>
                              {dayjs(item.date).format("DD/MM/YYYY HH:mm")}
                            </Text>
                            <Text>{formatBytes(item.size * 1024)}</Text>
                          </View>

                          {checked && (
                            <View style={styles.checkIcon}>
                              <AntDesign
                                name="checkcircle"
                                size={16}
                                color={color.theme}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isLoadingFiles ? (
                      <ActivityIndicator color={"green"} size={"small"} />
                    ) : (
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <FontAwesome
                          name="folder"
                          size={40}
                          color={color.theme}
                        />
                        <Text style={{ marginLeft: 10, fontSize: 16 }}>
                          Thư mục trống
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {filesSelected?.length > 0 && (
                  <View style={styles.footerGroup}>
                    <TouchableOpacity
                      onPress={() => {
                        state.onInit?.(filesSelected);
                        setVisible(false);
                      }}
                      style={styles.footerBtn}
                    >
                      <Text style={styles.footerTxt}>Xác nhận</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </View>
      <ModalAddFolder
        ref={addFolderRef}
        connectorPath={state.connectorPath}
        connectorInfo={state.connectorInfo}
        folderActive={folderActiveName}
        onSuccess={handleInit}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTop: {
    alignItems: "flex-end",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#eee",
    flexDirection: "row",
  },
  headerBtn: {
    marginRight: 20,
  },
  content: {
    flex: 1,
  },
  wrapper: {
    flexDirection: "row",
    flex: 1,
  },
  listFolder: {
    borderRightWidth: 0.8,
    borderRightColor: "gray",
    height: "100%",
  },
  listFile: {
    flex: 1,
    width: "100%",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.7,
    borderBottomColor: "#d7dcdf",
    paddingVertical: 10,
    paddingHorizontal: 4,
    width: "100%",
    backgroundColor: "#f7f8f9",
  },
  itemActive: {
    borderBottomWidth: null,
    borderBottomColor: null,
    borderColor: color.theme,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  svgWrapper: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  imageItem: {
    width: 70,
    height: 70,
    resizeMode: "contain",
    marginRight: 10,
  },
  checkIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  footerGroup: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,

    elevation: 5,
  },
  footerBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d7dcdf",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: color.theme,
  },
  footerTxt: {
    fontSize: 16,
    color: "#fff",
  },
});
export default forwardRef(Ckfinder);
