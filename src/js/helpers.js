/**
 * Convert group name, token name and possible prefix into kebab-case string, joining everything together
 */
Pulsar.registerFunction(
  "readableVariableName",
  function (token, tokenGroup, prefix) {
    // Create array with all path segments and token name at the end
    const segments = [...tokenGroup.path];
    if (!tokenGroup.isRoot) {
      segments.push(tokenGroup.name);
    }
    segments.push(token.name);

    if (prefix && prefix.length > 0) {
      segments.unshift(prefix);
    }

    // Create "sentence" separated by spaces so we can camelcase it all
    const tokenName = cleanSentence(segments.join(" "), true);
    if (tokenName === 'border') {
      return 'borderColor-default';
    }
    return tokenName
      .replace('scales-', '')
      .replace('grey', 'gray')
      .replace('base-neutral', 'neutral')
      .replace('border-bordercolor', 'borderColor')
      .replace('foreground-fgcolor', 'fgColor')
      .replace('fgcolor', 'fgColor')
      .replace('background-bgcolor', 'bgColor');
  }
);

Pulsar.registerFunction("readableGroupName", function (tokenGroup) {
  // Create array with all path segments and token name at the end
  const segments = [...tokenGroup.path];
  if (!tokenGroup.isRoot) {
    segments.push(tokenGroup.name);
  }

  // Create "sentence" separated by spaces so we can camelcase it all
  return cleanSentence(segments.join(" "), false);
});

Pulsar.registerFunction("cleanString", function (name) {
  return cleanSentence(name, false);
});

function cleanSentence(sentence, handleStartingDigits) {
  sentence = sentence
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => "-" + chr);

  // only allow letters, digits, underscore and hyphen
  sentence = sentence.replace(/[^a-zA-Z0-9_-]/g, "_");

  // prepend underscore if it starts with digit
  if (/^\d/.test(sentence) && handleStartingDigits) {
    sentence = "_" + sentence;
  }

  return sentence;
}

function getGroupNameFromOriginName(originName) {
  return originName.substr(0, originName.indexOf("/")).trim().toLowerCase();
}

function getGroups(allTokens) {
  let allGroups = allTokens.map((token) =>
    getGroupNameFromOriginName(token.origin.name)
  );
  let uniqueGroups = [...new Set(allGroups)];
  return uniqueGroups;
}

Pulsar.registerFunction("getGroups", getGroups);

function getTokensByGroup(allTokens, group) {
  return allTokens.filter((token) =>
    token.origin.name.substr(
      0,
      getGroupNameFromOriginName(token.origin.name) === group
    )
  );
}

Pulsar.registerFunction("getTokensByGroup", getTokensByGroup);

function findAliases(token, allTokens) {
  let aliases = allTokens.filter(
    (t) => t.value.referencedToken && t.value.referencedToken.id === token.id
  );
  for (const t of aliases) {
    aliases = aliases.concat(findAliases(t, allTokens));
  }
  return aliases;
}

Pulsar.registerFunction("findAliases", findAliases);

Pulsar.registerFunction("gradientAngle", function (from, to) {
  var deltaY = to.y - from.y;
  var deltaX = to.x - from.x;
  var radians = Math.atan2(deltaY, deltaX);
  var result = (radians * 180) / Math.PI;
  result = result + 90;
  return (result < 0 ? 360 + result : result) % 360;
});

/**
 * Behavior configuration of the exporter
 * Prefixes: Add prefix for each category of the tokens. For example, all colors can start with "color, if needed"
 */
Pulsar.registerPayload("behavior", {
  colorTokenPrefix: "color",
  borderTokenPrefix: "border",
  gradientTokenPrefix: "gradient",
  measureTokenPrefix: "measure",
  shadowTokenPrefix: "shadow",
  typographyTokenPrefix: "typography",
});

/** Describe complex shadow token */
Pulsar.registerFunction("shadowDescription", function (shadowToken) {
  let connectedShadow = shadowToken.shadowLayers
    ?.reverse()
    .map((shadow) => {
      return shadowTokenValue(shadow);
    })
    .join(", ");

  return connectedShadow;
});

/** Convert complex shadow value to CSS representation */
function shadowTokenValue(shadowToken) {
  var blurRadius = getValueWithCorrectUnit(
    nonNegativeValue(shadowToken.value.radius.measure)
  );
  var offsetX = getValueWithCorrectUnit(shadowToken.value.x.measure);
  var offsetY = getValueWithCorrectUnit(shadowToken.value.y.measure);
  var spreadRadius = getValueWithCorrectUnit(shadowToken.value.spread.measure);

  return `${
    shadowToken.value.type === "Inner" ? "inset " : ""
  }${offsetX} ${offsetY} ${blurRadius} ${spreadRadius} ${getFormattedRGB(
    shadowToken.value.color
  )}`;
}

function getValueWithCorrectUnit(value, unit, forceUnit) {
  if (value === 0 && forceUnit !== true) {
    return `${value}`;
  } else {
    // todo: add support for other units (px, rem, em, etc.)
    return `${value}px`;
  }
}

function nonNegativeValue(num) {
  if (num <= 0) {
    return 0;
  } else {
    return num;
  }
}

/** Convert type to CSS unit */
function measureTypeIntoReadableUnit(type) {
  switch (type) {
    case "Points":
      return "pt";
    case "Pixels":
      return "px";
    case "Percent":
      return "%";
    case "Ems":
      return "em";
    case "Rem":
      return "rem";
  }
}

function getFormattedRGB(colorValue) {
  if (colorValue.a === 0) {
    return `rgb(${colorValue.r},${colorValue.g},${colorValue.b})`;
  } else {
    const opacity = Math.round((colorValue.a / 255) * 100) / 100;
    return `rgba(${colorValue.r},${colorValue.g},${colorValue.b},${opacity})`;
  }
}

function rgbToOklchString(colorValue) {
  const a = Math.round((colorValue.a / 255) * 100) / 100;
  return `oklch(from #${colorValue.hex.slice(0, 6)} l c h${a !== 1 ? ' / ' + a : ''})`
}

Pulsar.registerFunction("rgbToOklchString", rgbToOklchString);

function addTokenType(token) {
  return {...token, token: true};
}

Pulsar.registerFunction("addTokenType", addTokenType);

function getDarkThemeId(themes) {
  return themes.find(theme => theme.name.toLowerCase() === 'dark mode').id;
}

Pulsar.registerFunction("getDarkThemeId", getDarkThemeId);
