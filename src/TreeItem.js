import React, {  useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import color from "../utils/color";

const TreeItem = ({
  level = 0,
  data,
  state,
  defaultExpanded,
  handleGetFiles,
  folderActiveName,
  resourceType,
  currentFolder,
}) => {
  // console.log('handleGetFiles', handleGetFiles);
  const [isExpanded, setIsExpanded] = useState(
    defaultExpanded && data.hasChildren
  );
  const [ckFinderData, setCkFinderData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { startupPath, connectorInfo, connectorPath } = state;

  const path = startupPath.split(":");
  const defaultCurrentFolder = path[1]?.replaceAll("/", "");

  useLayoutEffect(() => {
    //nếu là thư mục được mở mặc định
    if (defaultExpanded) {
      //nếu có thư mục con
      if (data.hasChildren) {
        handleLoadChild();
      }

      //nếu là thư mục lấy file mặc định
      if (data?.name === defaultCurrentFolder) {
        handleGetFiles?.(data?.name, resourceType);
      }
    }
  }, [
    defaultExpanded,
    handleLoadChild,
    handleGetFiles,
    state,
    data,
    defaultCurrentFolder,
    resourceType,
  ]);

  //lấy danh sách thư mục con
  const handleLoadChild = useCallback(async () => {
    setLoading(true);
    const url = `${connectorPath}?command=GetFolders&type=${resourceType}&currentFolder=${currentFolder}&${connectorInfo}`;
    try {
      const result = await fetch(url).then((res) => res.json());
      const response = result;
      setLoading(false);
      setCkFinderData(response);
    } catch (e) {
      setLoading(false);
    }
  }, [connectorInfo, connectorPath, resourceType, currentFolder]);

  function getIndicator(_isExpanded, hasChildrenNodes) {
    if (!hasChildrenNodes) {
      return "";
    } else if (loading) {
      return (
        <View style={{ transform: [{ scale: 0.8 }] }}>
          <ActivityIndicator size="small" color="#FFA501" />
        </View>
      );
    } else if (_isExpanded) {
      return <Feather name="chevron-down" size={20} color={"black"} />;
    } else {
      return <Feather name="chevron-right" size={20} color={"black"} />;
    }
  }

  const checkActive = folderActiveName === `${resourceType}/${data?.name}`;
  return (
    <View>
      <View
        style={[
          styles.treeItem,
          {
            paddingLeft: 15 * level,
            backgroundColor: checkActive ? "#fff" : "#f7f8f9",
          },
        ]}
      >
        <TouchableOpacity
          style={{
            paddingLeft: 10,
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
          }}
          onPress={() => handleGetFiles(data?.name, resourceType)}
        >
          <FontAwesome
            name={isExpanded || checkActive ? "folder-open" : "folder"}
            size={20}
            color={color.theme}
          />
          <Text style={{ fontSize: 14, marginLeft: 10 }}>{data?.name}</Text>
        </TouchableOpacity>

        {data?.hasChildren && (
          <TouchableOpacity
            disabled={!data?.hasChildren}
            style={{ paddingHorizontal: 5 }}
            onPress={() => {
              setIsExpanded(!isExpanded);
              if (!ckFinderData) {
                handleLoadChild();
              }
            }}
          >
            {getIndicator(isExpanded, data?.hasChildren)}
          </TouchableOpacity>
        )}
      </View>
      {isExpanded &&
        ckFinderData?.folders?.map((item, index) => (
          <TreeItem
            data={item}
            level={level + 1}
            state={state}
            key={`${item.name}-${index}`}
            handleGetFiles={handleGetFiles}
            defaultExpanded={defaultCurrentFolder === item.name}
            folderActiveName={folderActiveName}
            resourceType={ckFinderData.resourceType}
            currentFolder={`/${item.name}/`}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  treeItem: {
    flexDirection: "row",
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 0.7,
    borderBottomColor: "#d7dcdf",
    justifyContent: "space-between",
    backgroundColor: "#f7f8f9",
  },
});
export default TreeItem;
