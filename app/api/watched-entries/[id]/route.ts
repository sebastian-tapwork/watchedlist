import { supabase } from "@/src/lib/supabase";
import { getMovieRating } from "@/app/movie-ratings";

type UpdateWatchedEntryRequest = {
  watched_date?: unknown;
  platform?: unknown;
  rating?: unknown;
  words?: unknown;
};

function getOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as UpdateWatchedEntryRequest;
  const updatedEntry = await supabase
    .from("watched_entries")
    .update({
      watched_date: getOptionalText(body.watched_date),
      platform: getOptionalText(body.platform),
      rating: getMovieRating(body.rating),
      words: getOptionalText(body.words),
    })
    .eq("id", id)
    // TODO: Restore user_id filtering when authentication is added back.
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updatedEntry.error) {
    return Response.json({ error: updatedEntry.error.message }, { status: 400 });
  }

  if (!updatedEntry.data) {
    return Response.json({ error: "Watched entry not found." }, { status: 404 });
  }

  return Response.json({ id: updatedEntry.data.id });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deletedEntry = await supabase
    .from("watched_entries")
    .delete()
    .eq("id", id)
    // TODO: Restore user_id filtering when authentication is added back.
    .select("id")
    .maybeSingle<{ id: string }>();

  if (deletedEntry.error) {
    return Response.json({ error: deletedEntry.error.message }, { status: 400 });
  }

  if (!deletedEntry.data) {
    return Response.json({ error: "Watched entry not found." }, { status: 404 });
  }

  return Response.json({ id: deletedEntry.data.id });
}
