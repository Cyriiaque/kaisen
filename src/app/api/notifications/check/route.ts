import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/auth-actions";

/**
 * Route API pour vérifier les notifications en temps réel
 * Peut être appelée par le client pour vérifier les nouvelles notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Cette route nécessite une authentification
    // Pour une vraie implémentation, vous devriez utiliser des cookies de session
    // Pour simplifier, on va utiliser getCurrentUser depuis les headers
    
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return NextResponse.json({
      unreadCount,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification des notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification des notifications" },
      { status: 500 }
    );
  }
}

