import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  Pressable,
} from "react-native";
import Carousel from "react-native-x-carousel";
import { BannerData } from "../../data/BannerData"; // Adjust the path according to your project structure

const { width } = Dimensions.get("window");

const PaginationLight = ({ total = 1, activeIndex = 0 }) => {
  // Custom PaginationLight component implementation
  return (
    <View
      style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}
    >
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: index === activeIndex ? "#000" : "#ccc",
            marginHorizontal: 4,
          }}
        />
      ))}
    </View>
  );
};

const Banner = () => {
  const renderItem = (data) => (
    <View key={data._id} style={styles.cardContainer}>
      <Pressable onPress={() => alert(data._id)}>
        <View style={styles.cardWrapper}>
          <Image style={styles.card} source={data.coverImageUri} />
          <View
            style={[
              styles.cornerLabel,
              { backgroundColor: data.cornerLabelColor },
            ]}
          >
            <Text style={styles.cornerLabelText}>{data.cornerLabelText}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.bannerTitle}>Abush Barber Shop</Text>
      <Text style={styles.bannerSubtitle}>
        Innovating Traditional Barber Services with Technology
      </Text>
      <Carousel
        pagination={(props) => <PaginationLight {...props} />}
        renderItem={renderItem}
        data={BannerData}
        loop
        autoplay
      />
      <Text style={styles.footerText}>
        Where Style Meets Excellence – Welcome to Abush Barber Shop!
      </Text>
    </View>
  );
};

export default Banner;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10, // Reduced vertical padding
  },
  bannerTitle: {
    fontSize: 20, // Reduced font size
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5, // Reduced margin bottom
  },
  bannerSubtitle: {
    fontSize: 14, // Reduced font size
    color: "#666",
    marginBottom: 10, // Reduced margin bottom
  },
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
    width,
  },
  cardWrapper: {
    overflow: "hidden",
    borderRadius: 10,
  },
  card: {
    width: width * 0.9,
    height: width * 0.35, // Reduced height of the card image
    borderRadius: 10,
  },
  cornerLabel: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderTopLeftRadius: 8,
    padding: 5,
  },
  cornerLabelText: {
    fontSize: 12, // Reduced font size
    color: "#fff",
    fontWeight: "600",
  },
  footerText: {
    fontSize: 12, // Reduced font size
    color: "#000000",
    marginTop: 10, // Reduced margin top
    fontWeight: "500",
  },
});
