import { SvgXml } from 'react-native-svg';
import { useState, useEffect } from 'react';
import { Image } from 'react-native';

export async function fetchText(uri) {
  const response = await fetch(uri);
  return await response.text();
}

export function SvgUri(props) {
  const { onError = () => {}, uri } = props;
  const [xml, setXml] = useState(null);
  const [checkTransform, setCheckTransform] = useState(false);
  useEffect(() => {
    uri
      ? fetchText(uri)
          .then(res => {
            const check = res.search('transform') !== -1;
            setCheckTransform(check);
            setXml(res);
          })
          .catch(onError)
      : setXml(null);
  }, [onError, uri]);
  if (checkTransform) {
    return (
      <Image
        source={require('../assets/unknown.png')}
        style={{
          width: Number(props.width || 80),
          height: Number(props.height || 80),
          resizeMode: 'contain',
        }}
        resizeMode="contain"
      />
    );
  }
  return <SvgXml xml={xml} override={props} />;
}

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getInterpolate(
  input,
  inputMin,
  inputMax,
  outputMin,
  outputMax,
) {
  let result = input;

  if (outputMin === outputMax) {
    return outputMin;
  }

  if (inputMin === inputMax) {
    if (input <= inputMin) {
      return outputMin;
    }
    return outputMax;
  }

  // Input Range
  if (inputMin === -Infinity) {
    result = -result;
  } else if (inputMax === Infinity) {
    result = result - inputMin;
  } else {
    result = (result - inputMin) / (inputMax - inputMin);
  }

  // Output Range
  if (outputMin === -Infinity) {
    result = -result;
  } else if (outputMax === Infinity) {
    result = result + outputMin;
  } else {
    result = result * (outputMax - outputMin) + outputMin;
  }

  return result;
}
