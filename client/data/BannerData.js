
// Importing the images from assets
const barberShop1 = require("../assets/banner1.jpeg");
const barberShop2 = require("../assets/banner 2.jpeg");
const barberShop3 = require("../assets/banner3.jpeg");
const barberShop4 = require("../assets/banner4.jpeg");

export const BannerData = [
  {
    _id: 1,
    coverImageUri: barberShop1,
    cornerLabelColor: "#FFD300",
    cornerLabelText: "Book Now",
  },
  {
    _id: 2,
    coverImageUri: barberShop2,
    cornerLabelColor: "#0080ff",
    cornerLabelText: "Discounts",
  },
  {
    _id: 3,
    coverImageUri: barberShop3,
    cornerLabelColor: "#2ECC40",
    cornerLabelText: "Special Offers",
  },
  {
    _id: 4,
    coverImageUri: barberShop4,
    cornerLabelColor: "#2ECC40",
    cornerLabelText: "Premium",
  },
];
