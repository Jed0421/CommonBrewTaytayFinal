// Individual Product Images
import wintermelonMilkteaImg from '../assets/images/prod_exact_wintermelon_1787317610496.jpg';
import brownsugarMilkteaImg from '../assets/images/prod_brownsugar_milktea_1787316402694.jpg';
import thaiMilkteaImg from '../assets/images/prod_thai_milktea_1787316420300.jpg';
import cookiesCreamMilkteaImg from '../assets/images/prod_cookies_cream_milktea_1787316436923.jpg';
import taroMilkteaImg from '../assets/images/prod_taro_milktea_1787316451576.jpg';

import matchaLatteImg from '../assets/images/prod_matcha_latte_1787316472257.jpg';
import matchaStrawberryImg from '../assets/images/prod_matcha_strawberry_1787316496783.jpg';
import matchaCremeBruleeImg from '../assets/images/prod_matcha_creme_brulee_1787316510607.jpg';
import matchaFrappeImg from '../assets/images/prod_matcha_frappe_1787316525396.jpg';

import spanishLatteImg from '../assets/images/prod_spanish_latte_1787316555735.jpg';
import caramelMacchiatoImg from '../assets/images/prod_caramel_macchiato_1787316575040.jpg';
import seaSaltLatteImg from '../assets/images/prod_sea_salt_latte_1787316592366.jpg';
import hotCappuccinoImg from '../assets/images/prod_hot_cappuccino_1787316758297.jpg';

import strawberryFruitTeaImg from '../assets/images/prod_strawberry_fruittea_1787316670998.jpg';
import passionFruitTeaImg from '../assets/images/prod_passion_fruittea_1787316686347.jpg';
import greenAppleTeaImg from '../assets/images/prod_green_apple_tea_1787316742637.jpg';

// Dedicated Frappe Series Images
import strawberryFrappeImg from '../assets/images/strawberry_frappe_1791115098223.jpg';
import vanillaFrappeImg from '../assets/images/vanilla_frappe_1791115110638.jpg';
import redVelvetFrappeImg from '../assets/images/red_velvet_frappe_1791115122054.jpg';
import darkChocFrappeImg from '../assets/images/dark_choc_frappe_1791115134375.jpg';
import hersheysBlendFrappeImg from '../assets/images/hersheys_blend_frappe_1791115145873.jpg';
import chocTruffleFrappeImg from '../assets/images/choc_truffle_frappe_1791115157021.jpg';
import mochaFrappeImg from '../assets/images/mocha_frappe_1791115168335.jpg';
import cappuccinoFrappeImg from '../assets/images/cappuccino_frappe_1791115179350.jpg';
import caramelMacchiatoFrappeImg from '../assets/images/caramel_macchiato_frappe_1791115191860.jpg';

import blissBerryFizzImg from '../assets/images/prod_bliss_berry_fizz_1787316726986.jpg';

import ubeLatteImg from '../assets/images/prod_ube_latte_1787316612913.jpg';
import ubeCremeBruleeImg from '../assets/images/prod_ube_creme_brulee_1787316632351.jpg';
import ubeFrappeImg from '../assets/images/prod_ube_frappe_1787316651689.jpg';

// Series Fallback Images
import milkteaSeriesImg from '../assets/images/commonbrew_milktea_series_1787315576363.jpg';
import icedCoffeeSeriesImg from '../assets/images/commonbrew_iced_coffee_1787315593206.jpg';
import hotCoffeeSeriesImg from '../assets/images/commonbrew_hot_coffee_1787315615726.jpg';
import fruitTeaSeriesImg from '../assets/images/commonbrew_fruit_tea_1787315641755.jpg';
import matchaSeriesImg from '../assets/images/commonbrew_matcha_1787315663484.jpg';
import frappeSeriesImg from '../assets/images/commonbrew_frappe_1787315681303.jpg';
import sodaSeriesImg from '../assets/images/commonbrew_soda_fizz_1787315697296.jpg';
import ubeSeriesImg from '../assets/images/commonbrew_ube_series_1787315719739.jpg';

export const productSpecificImages: Record<string, string> = {
  // Milktea Series
  'Wintermelon Milktea': wintermelonMilkteaImg,
  'Brown Sugar Milktea': brownsugarMilkteaImg,
  'Classic Milktea': wintermelonMilkteaImg,
  'Cookies & Cream Milktea': cookiesCreamMilkteaImg,
  'Black Charcoal Milktea': cookiesCreamMilkteaImg,
  'Thai Milktea': thaiMilkteaImg,
  'Chocolate Milktea': taroMilkteaImg,
  'Caramel Milktea': brownsugarMilkteaImg,

  // Matcha Series
  'Matcha Latte': matchaLatteImg,
  'Matcha Crème Brulee Latte': matchaCremeBruleeImg,
  'Matcha Creamy Coconut Latte': matchaLatteImg,
  'Matcha Strawberry Latte': matchaStrawberryImg,
  'Matcha Frappe': matchaFrappeImg,
  'Matcha Strawberry Frappe': matchaStrawberryImg,

  // Iced Coffee Series
  'Iced Spanish Latte': spanishLatteImg,
  'Iced Caramel Coffee': caramelMacchiatoImg,
  'Iced Salted Caramel Coffee': caramelMacchiatoImg,
  'Iced Hazelnut Coffee': seaSaltLatteImg,
  'Iced Americano': seaSaltLatteImg,
  'Iced Chocolate Coffee': darkChocFrappeImg,
  'Iced French Vanilla Coffee': spanishLatteImg,
  'Iced White Chocolate Coffee': spanishLatteImg,
  'Iced Butterscotch Coffee': spanishLatteImg,

  // Hot Coffee Series
  'Hot Spanish Latte': hotCappuccinoImg,
  'Hot Café Mocha': hotCappuccinoImg,
  'Hot Caramel Macchiato': hotCappuccinoImg,
  'Hot Americano': hotCappuccinoImg,

  // Fruit Tea Series
  'Strawberry Fruit Tea': strawberryFruitTeaImg,
  'Passionfruit Tea': passionFruitTeaImg,
  'Green Apple Fruit Tea': greenAppleTeaImg,
  'Blueberry Fruit Tea': strawberryFruitTeaImg,
  'Sweet Grapes Fruit Tea': strawberryFruitTeaImg,
  'Peach Fruit Tea': passionFruitTeaImg,
  'Lemon Fruit Tea': passionFruitTeaImg,
  'Lychee Fruit Tea': passionFruitTeaImg,
  'Kiwi Fruit Tea': greenAppleTeaImg,

  // Frappe Series
  'Strawberry Frappe': strawberryFrappeImg,
  'Vanilla Frappe': vanillaFrappeImg,
  'Red Velvet Frappe': redVelvetFrappeImg,
  'Dark Chocolate Frappe': darkChocFrappeImg,
  "Hershey's Blend Frappe": hersheysBlendFrappeImg,
  'Chocolate Truffles Frappe': chocTruffleFrappeImg,
  'Chocolate Truffle Frappe': chocTruffleFrappeImg,
  'Mocha Frappe': mochaFrappeImg,
  'Cappuccino Frappe': cappuccinoFrappeImg,
  'Caramel Macchiato Frappe': caramelMacchiatoFrappeImg,

  // Soda Fizz Series
  'Bliss Berry Fizz': blissBerryFizzImg,
  'Passion Zest': passionFruitTeaImg,
  'Peachy Pop': blissBerryFizzImg,
  'Plum Fizz': blissBerryFizzImg,
  'Strawberry Zing': strawberryFruitTeaImg,
  'Green Fizz': greenAppleTeaImg,

  // Ube Series
  'Ube Latte': ubeLatteImg,
  'Ube Crème Brûlée': ubeCremeBruleeImg,
  'Ube Creamy Coconut': ubeLatteImg,
  'Ube Frappe': ubeFrappeImg,
};

export const getCategoryDrinkImage = (categoryId?: string | null, productName?: string | null): string => {
  const name = (productName || '').trim();
  const lowerName = name.toLowerCase();

  // 1. Direct exact name match
  if (productSpecificImages[name]) {
    return productSpecificImages[name];
  }

  // 2. Keyword matching on product name
  if (lowerName.includes('wintermelon')) return wintermelonMilkteaImg;
  if (lowerName.includes('brown sugar')) return brownsugarMilkteaImg;
  if (lowerName.includes('thai')) return thaiMilkteaImg;
  if (lowerName.includes('cookies') || lowerName.includes('charcoal')) return cookiesCreamMilkteaImg;
  if (lowerName.includes('taro')) return taroMilkteaImg;

  if (lowerName.includes('matcha') && lowerName.includes('strawberry')) return matchaStrawberryImg;
  if (lowerName.includes('matcha') && (lowerName.includes('brulee') || lowerName.includes('brûlée'))) return matchaCremeBruleeImg;
  if (lowerName.includes('matcha') && lowerName.includes('frappe')) return matchaFrappeImg;
  if (lowerName.includes('matcha')) return matchaLatteImg;

  if (lowerName.includes('ube') && (lowerName.includes('brulee') || lowerName.includes('brûlée'))) return ubeCremeBruleeImg;
  if (lowerName.includes('ube') && lowerName.includes('frappe')) return ubeFrappeImg;
  if (lowerName.includes('ube')) return ubeLatteImg;

  if (lowerName.includes('spanish')) return spanishLatteImg;
  if (lowerName.includes('caramel')) return caramelMacchiatoImg;
  if (lowerName.includes('salt') || lowerName.includes('americano') || lowerName.includes('hazelnut')) return seaSaltLatteImg;

  if (lowerName.includes('strawberry') && lowerName.includes('frappe')) return strawberryFrappeImg;
  if (lowerName.includes('vanilla') && lowerName.includes('frappe')) return vanillaFrappeImg;
  if (lowerName.includes('red velvet') && lowerName.includes('frappe')) return redVelvetFrappeImg;
  if (lowerName.includes('hershey')) return hersheysBlendFrappeImg;
  if (lowerName.includes('truffle')) return chocTruffleFrappeImg;
  if (lowerName.includes('mocha') && lowerName.includes('frappe')) return mochaFrappeImg;
  if (lowerName.includes('cappuccino') && lowerName.includes('frappe')) return cappuccinoFrappeImg;
  if (lowerName.includes('caramel') && lowerName.includes('frappe')) return caramelMacchiatoFrappeImg;
  if (lowerName.includes('dark chocolate') && lowerName.includes('frappe')) return darkChocFrappeImg;

  if (lowerName.startsWith('hot ') || lowerName.includes('hot coffee') || lowerName.includes('cappuccino')) return hotCappuccinoImg;

  if (lowerName.includes('strawberry')) return strawberryFruitTeaImg;
  if (lowerName.includes('passion') || lowerName.includes('lemon') || lowerName.includes('peach') || lowerName.includes('lychee')) return passionFruitTeaImg;
  if (lowerName.includes('apple') || lowerName.includes('kiwi') || lowerName.includes('green')) return greenAppleTeaImg;

  if (lowerName.includes('frappe') || lowerName.includes('chocolate') || lowerName.includes('hershey')) return darkChocFrappeImg;
  if (lowerName.includes('fizz') || lowerName.includes('soda') || lowerName.includes('pop') || lowerName.includes('zing')) return blissBerryFizzImg;

  // 3. Fallback category matching
  const cat = (categoryId || '').toLowerCase();
  if (cat.includes('milktea')) return milkteaSeriesImg;
  if (cat.includes('matcha')) return matchaSeriesImg;
  if (cat.includes('hotcoffee') || cat.includes('hot coffee')) return hotCoffeeSeriesImg;
  if (cat.includes('coffee')) return icedCoffeeSeriesImg;
  if (cat.includes('fruittea') || cat.includes('fruit tea')) return fruitTeaSeriesImg;
  if (cat.includes('frappe')) return frappeSeriesImg;
  if (cat.includes('soda')) return sodaSeriesImg;
  if (cat.includes('ube')) return ubeSeriesImg;

  return wintermelonMilkteaImg;
};
