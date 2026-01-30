/**
 * OptimizedImage – blur/placeholder while loading, fade-in on load, retry on error.
 * Respects cache headers (Cloudinary); 3 retries before showing placeholder.
 */
import React, { useState, useRef, useCallback } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

const MAX_RETRIES = 3;
const FADE_DURATION = 300;

export function OptimizedImage({
  source,
  style,
  placeholderStyle,
  resizeMode = 'cover',
  onLoad,
  onError,
  ...props
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;

  const uri = source?.uri ?? (typeof source === 'string' ? source : null);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start();
    onLoad?.();
  }, [opacity, onLoad]);

  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount((c) => c + 1);
      setLoading(true);
    } else {
      setLoading(false);
      setError(true);
    }
    onError?.();
  }, [retryCount, onError]);

  if (!uri) {
    return (
      <View style={[styles.placeholder, style, placeholderStyle]}>
        {props.children}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {(loading || error) && (
        <View style={[styles.placeholder, StyleSheet.absoluteFill, placeholderStyle]} />
      )}
      {!error && (
        <Animated.Image
          key={retryCount}
          source={{ uri, cache: 'default' }}
          style={[StyleSheet.absoluteFill, style, { opacity }]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#E9ECEF',
  },
});

export default OptimizedImage;
