import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

const ModalAddFolder = (
  { connectorPath, connectorInfo, folderActive, onSuccess },
  ref,
) => {
  const [visible, setVisible] = useState(false);
  const [valueName, setValueName] = useState('');
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    show: () => {
      setVisible(true);
    },
  }));

  useEffect(() => {
    if (!visible) {
      setValueName('');
    }
  }, [visible]);

  const onSubmit = async () => {
    const path = folderActive?.split('/') || [];
    const type = path[0];
    const currentFolder = path[1];

    const url = `${connectorPath}?command=CreateFolder&${
      type ? `type=${type}&` : ''
    }currentFolder=${
      currentFolder ? `/${currentFolder}/` : '/'
    }&newFolderName=${valueName}&${connectorInfo}`;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': ' application/x-www-form-urlencoded',
      },
    };

    setLoading(true);
    const response = await fetch(url, options).then(res => res.json());
    setLoading(false);
    if (response?.error?.message) {
      Alert.alert('Lỗi', 'Đã sảy ra lỗi trong khi thực hiện', [
        { text: 'OK', onPress: () => {} },
      ]);
    } else {
      setVisible(false);
      onSuccess?.();
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={() => setVisible(false)}
      statusBarTranslucent
      transparent>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <View style={styles.contentHeader}>
              <Text style={styles.contentHeaderTxt}>Tạo thư mục mới</Text>
            </View>
            <View style={styles.contentBody}>
              <Text>Hãy đặt tên cho thư mục mới</Text>
              <TextInput
                style={styles.textInput}
                value={valueName}
                onChangeText={setValueName}
              />
            </View>
            <View style={styles.contentFooter}>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={() => setVisible(false)}>
                <Text style={styles.footerTxt}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading}
                onPress={() => onSubmit()}
                style={[styles.footerBtn, { backgroundColor: '#5aaf41' }]}>
                {loading ? (
                  <View style={{ width: 43 }}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                ) : (
                  <Text style={[styles.footerTxt, { color: '#fff' }]}>
                    Đồng ý
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.7,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 5,
    overflow: 'hidden',
  },
  contentHeader: {
    padding: 10,
    backgroundColor: '#f7f8f9',
  },
  contentHeaderTxt: {
    fontSize: 16,
    fontWeight: '500',
  },
  contentBody: {
    padding: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d7dcdf',
    width: 280,
    height: 40,
    marginTop: 10,
    borderRadius: 5,
    paddingHorizontal: 5,
  },
  contentFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#f7f8f9',
  },
  footerBtn: {
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 0.7,
    borderColor: '#d7dcdf',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default forwardRef(ModalAddFolder);
