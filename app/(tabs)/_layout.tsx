import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

const COLORS = {
  bg: "#0A0A0A",
  accent: "#FFD700",
  textMuted: "#666666",
  border: "#222222",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: Platform.OS === "ios" ? 0 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="voitures"
        options={{
          title: "Voitures",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "car" : "car-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="publier"
        options={{
          title: "Publier",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Pages masquées de la barre de navigation */}
      <Tabs.Screen
        name="mes-reservations"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="favoris"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="mes-annonces"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="securite"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
