using System;
using System.Collections.Generic;
using Hex.Map;
using Hex.Render;
using Hex.Session.World;
using UnityEngine;
using UnityEngine.Rendering;

namespace Hex.MapGenerator.Tests;

public class BhDebugMapDrawer : MonoBehaviour
{
	public enum BackgroundMode
	{
		None = 0,
		Zones = 1,
		Subzones = 2,
		Minimap = 3
	}

	private struct PointerData
	{
		public Vector2 position;

		public int tile;

		public Vector2Int coords;

		public ITooltip tooltip;
	}

	private interface ITooltip
	{
		void GetContent(List<DebugGUI.ITextBoxLine> lines);
	}

	private class ContentTooltip : ITooltip
	{
		private string sid;

		private int variant;

		private int value;

		private int guardValue;

		private string faction;

		public void GetContent(List<DebugGUI.ITextBoxLine> lines)
		{
			lines.Clear();
			lines.Add(new DebugGUI.TextLine("sid: " + sid, TooltipTextStyle));
			if (variant >= 0)
			{
				lines.Add(new DebugGUI.TextLine("variant: " + variant, TooltipTextStyle));
			}
			if (!string.IsNullOrEmpty(faction))
			{
				lines.Add(new DebugGUI.TextLine("faction: " + faction, TooltipTextStyle));
			}
			if (value >= 0)
			{
				lines.Add(new DebugGUI.TextLine("value: " + value, TooltipTextStyle));
			}
			if (guardValue > 0)
			{
				lines.Add(new DebugGUI.TextLine("guardValue: " + guardValue, TooltipTextStyle));
			}
		}

		public ContentTooltip(string sid, int variant, int value, int guardValue, string faction)
		{
			this.sid = sid;
			this.variant = variant;
			this.value = value;
			this.guardValue = guardValue;
			this.faction = faction;
		}
	}

	private class GuardTooltip : ITooltip
	{
		private SquadParams squad;

		public void GetContent(List<DebugGUI.ITextBoxLine> lines)
		{
			lines.Clear();
			if (squad.isMain)
			{
				lines.Add(new DebugGUI.TextLine("main guard", TooltipTextStyle));
			}
			else
			{
				lines.Add(new DebugGUI.TextLine("guard", TooltipTextStyle));
			}
			lines.Add(new DebugGUI.TextLine("value: " + squad.value, TooltipTextStyle));
			lines.Add(new DebugGUI.TextLine("increment: " + squad.weeklyIncrement, TooltipTextStyle));
			lines.Add(new DebugGUI.TextLine("disposition: " + squad.disposition, TooltipTextStyle));
			lines.Add(new DebugGUI.TextLine("escape: " + squad.escape, TooltipTextStyle));
			if (squad.squadConfig != null)
			{
				lines.Add(new DebugGUI.TextLine("squad: " + squad.squadConfig.sid, TooltipTextStyle));
			}
		}

		public GuardTooltip(SquadParams squad)
		{
			this.squad = squad;
		}
	}

	private class PortalTooltip : ITooltip
	{
		private string destination;

		public void GetContent(List<DebugGUI.ITextBoxLine> lines)
		{
			lines.Clear();
			lines.Add(new DebugGUI.TextLine("portal to: " + destination, TooltipTextStyle));
		}

		public PortalTooltip(string destination)
		{
			this.destination = destination;
		}
	}

	private class MapObjectTooltip : ITooltip
	{
		private string sid;

		public void GetContent(List<DebugGUI.ITextBoxLine> lines)
		{
			lines.Clear();
			lines.Add(new DebugGUI.TextLine(sid, TooltipTextStyle));
		}

		public MapObjectTooltip(string sid)
		{
			this.sid = sid;
		}
	}

	private class GenericTooltip : ITooltip
	{
		private string info;

		public void GetContent(List<DebugGUI.ITextBoxLine> lines)
		{
			lines.Clear();
			lines.Add(new DebugGUI.TextLine(info, TooltipTextStyle));
		}

		public GenericTooltip(string info)
		{
			this.info = info;
		}
	}

	public class ViewData
	{
		public float generationTime;

		public GeneratorConfig generatorConfig;

		public MapDescription mapDesc;

		public Layout layout;

		public List<Encounter> allEncounters;

		public List<Vector2>[] cityPositions;

		public MapData mapData;

		public Layout.DebugInfo layoutDubug;

		public ContentPlacer.DebugInfo contentDubug;

		public string[] mapObjectByTile;

		public ViewData(GeneratorConfig generatorConfig, MapDescription mapDesc, Layout layout, ContentPlacer contentPlacer, MapData mapData, float time)
		{
			generationTime = time;
			this.generatorConfig = generatorConfig;
			this.layout = layout;
			this.mapDesc = mapDesc;
			this.mapData = mapData;
			mapObjectByTile = new string[layout.TileCount];
			layoutDubug = layout.GetDebugInfo();
			contentDubug = contentPlacer.GetDebugInfo();
			allEncounters = new List<Encounter>();
			cityPositions = new List<Vector2>[layout.ZoneCount];
			for (int i = 0; i < layout.ZoneCount; i++)
			{
				cityPositions[i] = new List<Vector2>();
				EncountersInZone encounters = layout.GetZone(i).encounters;
				for (int j = 0; j < encounters.Count; j++)
				{
					allEncounters.Add(encounters[j]);
				}
				for (int k = encounters.BeginByType(EncounterType.MainObject); k < encounters.EndByType(EncounterType.MainObject); k++)
				{
					cityPositions[i].Add(GridUtils.IndexToPosition(encounters[k].entrance, layout.Size));
				}
			}
			MapDataObjects[] objects = mapData.objects;
			foreach (MapDataObjects obj in objects)
			{
				string sid = obj.sid;
				int[] nodes = obj.nodes;
				foreach (int num in nodes)
				{
					mapObjectByTile[num] = sid;
				}
			}
		}
	}

	public struct SearchKey : IEquatable<SearchKey>
	{
		public string sid;

		public int variant;

		public SearchKey(string sid, int variant)
		{
			this.sid = sid;
			this.variant = variant;
		}

		public bool Equals(SearchKey other)
		{
			if (sid == other.sid)
			{
				return variant == other.variant;
			}
			return false;
		}

		public override int GetHashCode()
		{
			return Utils.CombineHashes(sid.GetHashCode(), variant);
		}
	}

	public static class DebugSprites
	{
		public const int None = 0;

		public const int Cliff = 1;

		public const int Castle = 2;

		public const int Water = 3;

		public const int Obstacle = 4;

		public const int Ramp = 5;

		public const int GuardRed = 6;

		public const int Reserved = 7;

		public const int QuestionMark = 8;

		public const int Pickup = 9;

		public const int BuildingGrey = 10;

		public const int ReservedWalkable = 11;

		public const int RoadStone = 12;

		public const int PickupQuestionMark = 13;

		public const int GuardGrey = 14;

		public const int PickupQuestionMarkGrey = 15;

		public const int PickupGrey = 16;

		public const int River = 17;

		public const int Building = 21;

		public static int GetPickupIcon(bool optional, bool filled)
		{
			if (filled)
			{
				if (!optional)
				{
					return 9;
				}
				return 13;
			}
			if (!optional)
			{
				return 16;
			}
			return 15;
		}
	}

	private BhMapgenDebugController controller;

	private Camera cam;

	private float previewSize;

	private MeshFilter meshFilter;

	private Material material;

	private ViewData viewData;

	private Color[] colors;

	private List<Vector2> searchPositions = new List<Vector2>();

	private List<int> searchTiles = new List<int>();

	private HashSet<SearchKey> searchSet = new HashSet<SearchKey>();

	private int[] searchCountByZone;

	private TemplateContext templateContext;

	private PointerData pointerData;

	private List<DebugGUI.ITextBoxLine> tempTextBoxContent = new List<DebugGUI.ITextBoxLine>();

	private bool blink;

	private float nextBlink;

	private float pulseScale = 1f;

	private SoMinimapConfig minimapConfig;

	private RenderTexture minimapRenderTexture;

	private GUIStyle textStyle;

	private GUIStyle textStyleHeader;

	private GUIStyle textStyleData;

	private Color guiLineColor = new Color(0.7f, 0.7f, 0.7f, 1f);

	private static GUIStyle tooltipTextStyle;

	private static GUIStyle TooltipTextStyle
	{
		get
		{
			if (tooltipTextStyle == null)
			{
				tooltipTextStyle = new GUIStyle(GUI.skin.label)
				{
					fontSize = 24,
					alignment = TextAnchor.MiddleLeft,
					fontStyle = FontStyle.Bold
				};
			}
			return tooltipTextStyle;
		}
	}

	private void OnEnable()
	{
		cam = Camera.main;
		minimapConfig = Resources.Load<SoMinimapConfig>("configs/MinimapConfig");
		minimapRenderTexture = MinimapRenderer.CreateTarget();
	}

	public void PreviewMap(ViewData viewData)
	{
		previewSize = 10f;
		material.SetTexture("_MainTex", controller.texture);
		material.SetTexture("_Hatch", controller.elevation);
		material.SetTexture("_Minimap", minimapRenderTexture);
		this.viewData = viewData;
		meshFilter.mesh = BuildGridMesh(viewData.layout.Size.x, viewData.layout.Size.y);
		meshFilter.mesh.colors = ColorData(viewData, controller.BackgroundMode);
		meshFilter.mesh.SetUVs(0, UvData(viewData));
		meshFilter.mesh.SetUVs(2, ExtraUvData(viewData));
		Vector2 vector = viewData.layout.Size;
		vector /= Mathf.Max(vector.x, vector.y);
		base.transform.localScale = new Vector3(vector.x, vector.y, 1f) * previewSize;
		searchCountByZone = new int[viewData.layout.ZoneCount];
		ServiceLocator.GetInstance().Minimap.RenderMapPreview(minimapRenderTexture, viewData.mapData, minimapConfig);
		templateContext = new TemplateContext(viewData.mapDesc.template, viewData.generatorConfig);
	}

	public void UpdateSearch(string searchString, SearchMode searchMode)
	{
		searchTiles.Clear();
		Utils.FillArray(searchCountByZone, 0);
		switch (searchMode)
		{
		case SearchMode.MapObject:
			SearchMapObjects(searchString);
			break;
		case SearchMode.Content:
			SearchContent(searchString);
			break;
		case SearchMode.ContentList:
			SearchContentList(searchString);
			break;
		}
		SetHighlightPositions(searchTiles);
	}

	private void SearchContent(string searchString)
	{
		string[] array = searchString.Split(' ');
		string text = array[0].Trim();
		if (text.Length == 0)
		{
			return;
		}
		int num = -1;
		if (array.Length > 1 && int.TryParse(array[1], out var result))
		{
			num = result;
		}
		for (int i = 0; i < viewData.layout.ZoneCount; i++)
		{
			foreach (var (contentSlot, content) in viewData.contentDubug.contentSummaries[i].contentList)
			{
				if (content.objectDesc.mapConfig == null)
				{
					continue;
				}
				MapObjectDesc objectDesc = content.objectDesc;
				bool num2 = objectDesc.Sid.StartsWith(text);
				bool flag = num < 0 || num == content.objectDesc.variant;
				if (num2 && flag)
				{
					int position = contentSlot.GetPosition(viewData.layout.Size);
					int? num3 = viewData.layout.GetPlayableZoneIdAt(position);
					if (num3.HasValue)
					{
						searchCountByZone[num3.Value]++;
					}
					searchTiles.Add(position);
				}
			}
		}
	}

	private void SearchContentList(string searchString)
	{
		templateContext.ContentLists.TryGetById(searchString, out var value);
		if (value == null)
		{
			return;
		}
		searchSet.Clear();
		foreach (ContentWeight item in value.content)
		{
			searchSet.Add(new SearchKey(item.sid, item.variant));
		}
		for (int i = 0; i < viewData.layout.ZoneCount; i++)
		{
			foreach (var (contentSlot, content) in viewData.contentDubug.contentSummaries[i].contentList)
			{
				if (content.objectDesc.mapConfig == null)
				{
					continue;
				}
				HashSet<SearchKey> hashSet = searchSet;
				MapObjectDesc objectDesc = content.objectDesc;
				int num = 0 | (hashSet.Contains(new SearchKey(objectDesc.Sid, -1)) ? 1 : 0);
				HashSet<SearchKey> hashSet2 = searchSet;
				objectDesc = content.objectDesc;
				if (((uint)num | (hashSet2.Contains(new SearchKey(objectDesc.Sid, content.objectDesc.variant)) ? 1u : 0u)) != 0)
				{
					int position = contentSlot.GetPosition(viewData.layout.Size);
					int? num2 = viewData.layout.GetPlayableZoneIdAt(position);
					if (num2.HasValue)
					{
						searchCountByZone[num2.Value]++;
					}
					searchTiles.Add(position);
				}
			}
		}
	}

	private void SearchMapObjects(string searchString)
	{
		string[] array = searchString.Split(' ');
		string text = array[0].Trim();
		if (text.Length == 0)
		{
			return;
		}
		int num = -1;
		if (array.Length > 1 && int.TryParse(array[1], out var result))
		{
			num = result;
		}
		MapDataObjects[] objects = viewData.mapData.objects;
		foreach (MapDataObjects mapDataObjects in objects)
		{
			if (!mapDataObjects.sid.StartsWith(text))
			{
				continue;
			}
			for (int j = 0; j < mapDataObjects.nodes.Length; j++)
			{
				if (num >= 0)
				{
					int key = mapDataObjects.ids[j];
					if (viewData.contentDubug.variantByObjectId.TryGetValue(key, out var value) && value != num)
					{
						continue;
					}
				}
				int num2 = mapDataObjects.nodes[j];
				int? num3 = viewData.layout.GetPlayableZoneIdAt(num2);
				if (num3.HasValue)
				{
					searchCountByZone[num3.Value]++;
				}
				searchTiles.Add(num2);
			}
		}
	}

	private void SetHighlightPositions(List<int> tiles)
	{
		searchPositions.Clear();
		Vector2 vector = GetTileSize() * 0.5f;
		foreach (int tile in tiles)
		{
			Vector2 normalizedPosition = GridUtils.IndexToPosition(tile, viewData.layout.Size);
			searchPositions.Add(PositionToWorldPosition(normalizedPosition) + vector);
		}
	}

	public static BhDebugMapDrawer Instantiate(BhMapgenDebugController controller, Vector2 position)
	{
		GameObject gameObject = new GameObject("MapPreview");
		MeshFilter meshFilter = gameObject.AddComponent<MeshFilter>();
		MeshRenderer meshRenderer = gameObject.AddComponent<MeshRenderer>();
		BhDebugMapDrawer bhDebugMapDrawer = gameObject.AddComponent<BhDebugMapDrawer>();
		Material material = (meshRenderer.material = new Material(Shader.Find("Hex/Misc/MapDebug")));
		bhDebugMapDrawer.meshFilter = meshFilter;
		bhDebugMapDrawer.material = material;
		bhDebugMapDrawer.controller = controller;
		bhDebugMapDrawer.colors = controller.colors;
		gameObject.transform.localScale = Vector3.one * 10f;
		gameObject.transform.localPosition = position;
		return bhDebugMapDrawer;
	}

	private void Update()
	{
		if (Time.time > nextBlink)
		{
			blink = !blink;
			nextBlink = Time.time + 0.5f;
		}
		pulseScale = 1f + Mathf.Sin(Time.time * 5f) * 0.07f;
		material.SetFloat("_ShowElevation", controller.showElevation ? 1 : 0);
		material.SetFloat("_ShowIcons", controller.showIcons ? 1 : 0);
		material.SetFloat("_ShowMinimap", (controller.BackgroundMode == BackgroundMode.Minimap) ? 1 : 0);
		material.SetFloat("_ShowMandatoryContent", controller.highlightMandatory ? 1 : 0);
		UpdatePointerData();
	}

	private void OnDrawGizmos()
	{
		if (viewData != null)
		{
			Vector2 vector = viewData.layout.Size;
			vector *= 1f / Mathf.Max(vector.x, vector.y);
			Mathf.Min(vector.x, vector.y);
		}
	}

	private void OnGUI()
	{
		if (textStyle == null)
		{
			textStyle = new GUIStyle(GUI.skin.label);
			textStyle.fontSize = 24;
			textStyle.alignment = TextAnchor.MiddleCenter;
			textStyleHeader = new GUIStyle(GUI.skin.label);
			textStyleHeader.fontSize = 24;
			textStyleHeader.alignment = TextAnchor.MiddleCenter;
			textStyleHeader.fontStyle = FontStyle.Bold;
			textStyleData = new GUIStyle(GUI.skin.label);
			textStyleData.fontSize = 24;
			textStyleData.alignment = TextAnchor.MiddleCenter;
			textStyleData.normal.textColor = new Color(0.5f, 0.5f, 0.5f, 1f);
		}
		if (pointerData.tooltip != null)
		{
			pointerData.tooltip.GetContent(tempTextBoxContent);
			DebugGUI.DrawTextBox(cam.WorldToScreenPoint(pointerData.position), tempTextBoxContent);
		}
		if ((bool)controller.zoneInfoEnabled)
		{
			for (int i = 0; i < viewData.layout.ZoneCount; i++)
			{
				DrawZoneSummary(i);
			}
		}
		float num = (float)Screen.height * 1.5f / 1080f;
		GUI.matrix = Matrix4x4.TRS(Vector3.zero, Quaternion.identity, new Vector3(num, num, 1f));
		GUILayout.BeginArea(new Rect(0f, 0f, (float)Screen.width / num, (float)Screen.height / num));
		GUILayout.BeginVertical();
		GUILayout.FlexibleSpace();
		GUILayout.BeginHorizontal();
		GUILayout.FlexibleSpace();
		GUILayout.BeginVertical(GUI.skin.box);
		GUILayout.Label($"X: {pointerData.coords.x}, Z: {pointerData.coords.y}. node: {pointerData.tile}", GUILayout.Width(200f));
		GUILayout.EndVertical();
		GUILayout.EndHorizontal();
		GUILayout.EndVertical();
		GUILayout.EndArea();
	}

	private void DrawZoneSummary(int zoneIndex)
	{
		tempTextBoxContent.Clear();
		ContentPlacer.DebugInfo.ZoneContentSummary zoneContentSummary = viewData.contentDubug.contentSummaries[zoneIndex];
		MapDescription mapDesc = viewData.mapDesc;
		tempTextBoxContent.Add(new DebugGUI.TextLine("Zone: " + mapDesc.zones[zoneIndex].name, textStyleHeader));
		if ((bool)controller.zoneInfoSearchCount)
		{
			tempTextBoxContent.Add(new DebugGUI.SloidLine(guiLineColor));
			tempTextBoxContent.Add(new DebugGUI.TextLine($"Search results: {searchCountByZone[zoneIndex]}", textStyle));
			tempTextBoxContent.Add(new DebugGUI.SloidLine(guiLineColor));
		}
		byte zoneBiome = viewData.mapDesc.zones[zoneIndex].zoneBiome;
		byte contentBiome = viewData.mapDesc.zones[zoneIndex].contentBiome;
		byte metaObjectsBiome = viewData.mapDesc.zones[zoneIndex].metaObjectsBiome;
		if ((bool)controller.zoneInfoGeneral)
		{
			tempTextBoxContent.Add(new DebugGUI.TextLine("Biome: " + MapConfig.me.tiles.Get(zoneBiome).biome, textStyle));
			tempTextBoxContent.Add(new DebugGUI.TextLine("Content: " + MapConfig.me.tiles.Get(contentBiome).biome, textStyle));
			tempTextBoxContent.Add(new DebugGUI.TextLine("Meta objs: " + MapConfig.me.tiles.Get(metaObjectsBiome).biome, textStyle));
			tempTextBoxContent.Add(new DebugGUI.TextLine($"Area: {viewData.layoutDubug.partitionDatas[zoneIndex].area}", textStyle));
			tempTextBoxContent.Add(new DebugGUI.TextLine($"Total value: {zoneContentSummary.totalValue:n0}", textStyle));
		}
		if ((bool)controller.zoneInfoGuarded)
		{
			tempTextBoxContent.Add(new DebugGUI.SloidLine(guiLineColor));
			AddCategorySummary("Guarded", zoneContentSummary.guarded);
		}
		if ((bool)controller.zoneInfoUnguarded)
		{
			tempTextBoxContent.Add(new DebugGUI.SloidLine(guiLineColor));
			AddCategorySummary("Unguarded", zoneContentSummary.unguarded);
		}
		Vector2 vector = PositionToWorldPosition(viewData.layoutDubug.zonePositions[zoneIndex]);
		DebugGUI.DrawTextBox(cam.WorldToScreenPoint(vector), tempTextBoxContent);
	}

	private void AddCategorySummary(string name, ContentPlacer.DebugInfo.ContentCategorySummary category)
	{
		DebugGUI.Table table = new DebugGUI.Table();
		table.SetColumnCount(8);
		table.SetSpacing(25f, 0f);
		tempTextBoxContent.Add(new DebugGUI.TextLine(name, textStyleHeader));
		tempTextBoxContent.Add(new DebugGUI.TextLine($"Value Mandatory: {category.valueMandatory:n0}", textStyle));
		tempTextBoxContent.Add(new DebugGUI.TextLine($"Value Random: {category.valueRandom:n0}", textStyle));
		tempTextBoxContent.Add(new DebugGUI.TextLine($"Value Resources: {category.valueResources:n0}", textStyle));
		tempTextBoxContent.Add(new DebugGUI.TextLine($"Pickup Slots: {category.pickupSlotsCount}", textStyle));
		string text = $"Building Slots: {category.buildingSlotsCount}";
		text += $" (1 - {category.buildingSlotsCountBySize[0]}, ";
		text += $"2 - {category.buildingSlotsCountBySize[1]}, ";
		text += $"3 - {category.buildingSlotsCountBySize[2]})";
		tempTextBoxContent.Add(new DebugGUI.TextLine(text, textStyle));
		if ((bool)controller.zoneInfoPoolInfo)
		{
			table.AddElement("Bracket", textStyle);
			table.AddElement("Target %", textStyle);
			table.AddElement("Actual %", textStyle);
			table.AddElement("Pickups\nIn Pool", textStyle);
			table.AddElement("Buildings\nIn Pool", textStyle);
			table.AddElement("Size 1", textStyle);
			table.AddElement("Size 2", textStyle);
			table.AddElement("Size 3", textStyle);
			for (int i = 0; i < category.brackets.Length; i++)
			{
				float num = category.targetPercentages[i];
				float num2 = category.actualPercentages[i];
				if (num != 0f || num2 != 0f)
				{
					Vector2Int vector2Int = category.brackets[i];
					string text2 = $"{vector2Int.x / 1000}k";
					string text3 = ((vector2Int.y > 0) ? $"{vector2Int.y / 1000}k" : "inf");
					table.AddElement(text2 + " - " + text3, textStyleData);
					table.AddElement($"{num * 100f:F0}", textStyleData);
					table.AddElement($"{num2 * 100f:F0}", textStyleData);
					int[,] buildingsInBrackets = category.buildingsInBrackets;
					table.AddElement($"{category.pickupsInBrackets[i]}", textStyleData);
					table.AddElement($"{buildingsInBrackets[i, 0]}", textStyleData);
					table.AddElement($"{buildingsInBrackets[i, 1]}", textStyleData);
					table.AddElement($"{buildingsInBrackets[i, 2]}", textStyleData);
					table.AddElement($"{buildingsInBrackets[i, 3]}", textStyleData);
				}
			}
		}
		tempTextBoxContent.Add(table);
	}

	private void UpdatePointerData()
	{
		pointerData.tooltip = null;
		pointerData.position = cam.ScreenToWorldPoint(Input.mousePosition);
		ref int tile = ref pointerData.tile;
		ref Vector2Int coords = ref pointerData.coords;
		(tile, coords) = TileUnderMousePointer(pointerData.position);
		if (pointerData.tile < 0)
		{
			return;
		}
		Content? content = viewData.contentDubug.contentByTile[pointerData.tile];
		(int, int)? tuple2 = viewData.contentDubug.mainObjectByTile[pointerData.tile];
		if ((bool)controller.tooltipContent)
		{
			if (content.HasValue && content.Value.objectDesc.mapConfig != null)
			{
				pointerData.tooltip = new ContentTooltip(content.Value.objectDesc.Sid, content.Value.objectDesc.variant, content.Value.value, content.Value.guardValue, null);
				return;
			}
			if (tuple2.HasValue)
			{
				(int, int) value = tuple2.Value;
				int item = value.Item1;
				int item2 = value.Item2;
				MapDescription.MainObject mainObject = viewData.mapDesc.zones[item].mainObjects[item2];
				pointerData.tooltip = new ContentTooltip(mainObject.type.ToString(), -1, -1, -1, mainObject.faction);
				return;
			}
			Guard? guard = viewData.contentDubug.guardByTile[pointerData.tile];
			if (guard.HasValue)
			{
				pointerData.tooltip = new GuardTooltip(guard.Value.squad);
				return;
			}
			if (viewData.contentDubug.portalByTile.TryGetValue(pointerData.tile, out var value2))
			{
				pointerData.tooltip = new PortalTooltip(viewData.mapDesc.zones[value2].name);
				return;
			}
			byte road = viewData.mapData.GetRoad(pointerData.tile);
			if (road > 0)
			{
				string text = ((road == 1) ? "dirt" : "stone");
				pointerData.tooltip = new GenericTooltip("road " + text);
				return;
			}
		}
		Encounter? encounter = viewData.contentDubug.encounterByTile[pointerData.tile];
		if ((bool)controller.tooltipEncounter && encounter.HasValue)
		{
			pointerData.tooltip = new GenericTooltip(encounter.Value.template.name);
			return;
		}
		string text2 = viewData.mapObjectByTile[pointerData.tile];
		if ((bool)controller.tooltipMapObject && text2 != null)
		{
			pointerData.tooltip = new MapObjectTooltip(text2);
		}
	}

	private Vector2 PositionToWorldPosition(Vector2 normalizedPosition)
	{
		Vector2 vector = viewData.layout.Size;
		vector /= Mathf.Max(vector.x, vector.y);
		return (normalizedPosition - Vector2.one * 0.5f) * previewSize * vector + (Vector2)base.transform.position;
	}

	public Vector2 GetTileSize()
	{
		Vector2 vector = viewData.layout.Size;
		vector = Vector2.one / Mathf.Max(vector.x, vector.y);
		return vector * previewSize;
	}

	private Vector2Int TileCoordsFromWorldPosition(Vector2 position)
	{
		Vector2 vector = position - (Vector2)base.transform.position;
		vector /= previewSize;
		vector += Vector2.one * 0.5f;
		return Vector2Int.FloorToInt(viewData.layout.Size * vector);
	}

	private (int, Vector2Int) TileUnderMousePointer(Vector2 position)
	{
		Vector2Int vector2Int = TileCoordsFromWorldPosition(position);
		if (!GridUtils.CheckBounds(vector2Int, viewData.layout.Size))
		{
			return (-1, vector2Int);
		}
		return (GridUtils.CoordsToIndex(vector2Int, viewData.layout.Size), vector2Int);
	}

	private Color[] ColorData(ViewData data, BackgroundMode backgroundMode)
	{
		Color[] array = new Color[data.layout.TileCount * 4];
		for (int i = 0; i < data.layout.TileCount; i++)
		{
			int num = 0;
			if (backgroundMode == BackgroundMode.Zones)
			{
				num = ((int?)data.layout.GetPlayableZoneIdAt(i)) ?? (-1);
			}
			if (backgroundMode == BackgroundMode.Subzones)
			{
				num = data.layoutDubug.subzoneMap[i];
				if (num == -1)
				{
					num = -1;
				}
			}
			if ((bool)controller.showPathClusters)
			{
				int num2 = data.layoutDubug.pathClusterMap[i];
				if (num2 >= 0 && num >= 0)
				{
					num += num2;
				}
			}
			Color color = GetMapColor(num);
			if (((bool)controller.showPaths || (bool)controller.showPathClusters) && data.layout.GetObstacleStateAt(i) == ObstacleState.AlwaysFree)
			{
				Color.RGBToHSV(color, out var H, out var S, out var V);
				V += 0.1f;
				S -= 0.1f;
				color = Color.HSVToRGB(H, S, V);
			}
			for (int j = 0; j < 4; j++)
			{
				array[i * 4 + j] = color;
			}
		}
		return array;
	}

	private Vector4[] ExtraUvData(ViewData data)
	{
		Vector4[] array = new Vector4[data.layout.TileCount * 4];
		for (int i = 0; i < data.layout.TileCount; i++)
		{
			Vector4 zero = Vector4.zero;
			Content? content = data.contentDubug.contentByTile[i];
			zero.x = (content.HasValue ? 1 : 0);
			if (content.HasValue && content.Value.pool != null)
			{
				zero.y = 1f;
			}
			array[i * 4] = zero;
			array[i * 4 + 1] = zero;
			array[i * 4 + 2] = zero;
			array[i * 4 + 3] = zero;
		}
		return array;
	}

	private Vector4[] UvData(ViewData data)
	{
		Vector4[] array = new Vector4[data.layout.TileCount * 4];
		for (int i = 0; i < data.layout.TileCount; i++)
		{
			int spriteIndex = data.contentDubug.obstaclesMap[i] switch
			{
				ObstacleState.Free => 0, 
				ObstacleState.Cliff => 1, 
				ObstacleState.Water => 3, 
				ObstacleState.Obstacle => 4, 
				ObstacleState.AlwaysObstacle => 4, 
				ObstacleState.Border => 4, 
				ObstacleState.Reserved => controller.reservedIcons ? 7 : 0, 
				ObstacleState.ReservedWalkable => controller.reservedIcons ? 11 : 0, 
				ObstacleState.ReservedRoadTarget => controller.reservedIcons ? 7 : 0, 
				_ => 0, 
			};
			if ((bool)controller.riverIcons && data.layout.GetRiverAt(i) != 0)
			{
				spriteIndex = 17;
			}
			SetSpriteUV(array, i, spriteIndex);
		}
		for (int j = 0; j < data.layout.GateCount; j++)
		{
			Gate gate = data.layout.GetGate(j);
			if (!gate.isValid)
			{
				continue;
			}
			if ((bool)controller.guardIcons)
			{
				SetSpriteUV(array, gate.guardPosition, 14);
			}
			if (gate.rampPosition > 0)
			{
				for (int k = 0; k < gate.rampWidth; k++)
				{
					Vector2Int vector2Int = Direction.FromIndex(gate.rampDirection);
					SetSpriteUV(array, GridUtils.GetNeighbour(vector2Int * k, gate.rampPosition, data.layout.Size), 5);
				}
			}
		}
		for (int l = 0; l < data.layout.TileCount; l++)
		{
			if ((bool)controller.roadIcons && data.layout.GetRoadAt(l).HasValue)
			{
				SetSpriteUV(array, l, 12);
			}
		}
		if ((bool)controller.encounterIcons)
		{
			foreach (Encounter allEncounter in data.allEncounters)
			{
				SetSpritesForEncounter(array, allEncounter, data.layout, data);
			}
		}
		for (int m = 0; m < data.layout.TileCount; m++)
		{
			if ((bool)controller.guardIcons && data.contentDubug.guardByTile[m].HasValue)
			{
				SetSpriteUV(array, m, 6);
			}
		}
		if ((bool)controller.ambientPickupIcons)
		{
			for (int n = 0; n < data.layout.ZoneCount; n++)
			{
				foreach (int item in data.contentDubug.ambientPickupTiles[n])
				{
					SetSpriteUV(array, item, 9);
				}
			}
		}
		for (int num = 0; num < data.layout.TileCount; num++)
		{
			float z = Mathf.Clamp01(data.layout.GetElevationAt(num));
			array[num * 4].z = z;
			array[num * 4 + 1].z = z;
			array[num * 4 + 2].z = z;
			array[num * 4 + 3].z = z;
		}
		return array;
	}

	private void SetSpritesForEncounter(Vector4[] uv, Encounter encounterSlot, Layout layout, ViewData data)
	{
		Vector2Int vector2Int = GridUtils.IndexToCoords(encounterSlot.position, layout.Size);
		PickupSlot[] pickups = encounterSlot.template.pickups;
		for (int i = 0; i < pickups.Length; i++)
		{
			PickupSlot pickupSlot = pickups[i];
			int num = GridUtils.CoordsToIndex(vector2Int + pickupSlot.position, layout.Size);
			Content? content = data.contentDubug.contentByTile[num];
			bool filled = content.HasValue && content.Value.value > 0;
			SetSpriteUV(uv, num, DebugSprites.GetPickupIcon(pickupSlot.isOptional, filled));
		}
		bool flag = encounterSlot.template.encounterType == EncounterTemplateType.City;
		flag |= encounterSlot.template.encounterType == EncounterTemplateType.GladiatorArena;
		BuildingSlot[] buildings = encounterSlot.template.buildings;
		for (int i = 0; i < buildings.Length; i++)
		{
			BuildingSlot buildingSlot = buildings[i];
			Vector2Int vector2Int2 = vector2Int + buildingSlot.position;
			for (int j = 0; j < buildingSlot.width; j++)
			{
				for (int k = 0; k < buildingSlot.height; k++)
				{
					int num2 = GridUtils.CoordsToIndex(vector2Int2 + new Vector2Int(j, k), layout.Size);
					Content? content2 = data.contentDubug.contentByTile[num2];
					if (flag)
					{
						SetSpriteUV(uv, num2, 2);
					}
					else
					{
						SetSpriteUV(uv, num2, content2.HasValue ? 21 : 10);
					}
				}
			}
		}
		GuardSlot[] guards = encounterSlot.template.guards;
		for (int i = 0; i < guards.Length; i++)
		{
			GuardSlot guardSlot = guards[i];
			int quadIndex = GridUtils.CoordsToIndex(vector2Int + guardSlot.position, layout.Size);
			if ((bool)controller.guardIcons)
			{
				SetSpriteUV(uv, quadIndex, 14);
			}
		}
	}

	private void SetSpriteUV(Vector4[] uv, int quadIndex, int spriteIndex)
	{
		Vector2 vector = (float)(spriteIndex % 4) / 4f * Vector2.right;
		vector += (float)(spriteIndex / 4) / 8f * Vector2.up;
		float x = 0.25f;
		float y = 0.125f;
		uv[quadIndex * 4] = vector + new Vector2(0f, 0f);
		uv[quadIndex * 4 + 1] = vector + new Vector2(0f, y);
		uv[quadIndex * 4 + 2] = vector + new Vector2(x, y);
		uv[quadIndex * 4 + 3] = vector + new Vector2(x, 0f);
	}

	private Mesh BuildGridMesh(int sizeX, int sizeY)
	{
		Mesh mesh = new Mesh();
		mesh.indexFormat = IndexFormat.UInt32;
		Vector3[] array = new Vector3[sizeX * sizeY * 4];
		Vector3[] array2 = new Vector3[sizeX * sizeY * 4];
		int[] array3 = new int[sizeX * sizeY * 2 * 3];
		Vector2 vector = new Vector2(1f / (float)sizeX, 1f / (float)sizeY);
		Vector2 vector2 = Vector2.one * 0.5f;
		Vector2 vector3 = new Vector2(1f / (float)sizeX, 1f / (float)sizeY);
		for (int i = 0; i < sizeX; i++)
		{
			for (int j = 0; j < sizeY; j++)
			{
				int num = i + sizeX * j;
				array[num * 4] = new Vector2(i, j) * vector - vector2;
				array[num * 4 + 1] = new Vector2(i, j + 1) * vector - vector2;
				array[num * 4 + 2] = new Vector2(i + 1, j + 1) * vector - vector2;
				array[num * 4 + 3] = new Vector2(i + 1, j) * vector - vector2;
				array2[num * 4] = new Vector2(i, j) * vector3;
				array2[num * 4 + 1] = new Vector2(i, j + 1) * vector3;
				array2[num * 4 + 2] = new Vector2(i + 1, j + 1) * vector3;
				array2[num * 4 + 3] = new Vector2(i + 1, j) * vector3;
				array3[num * 6] = num * 4;
				array3[num * 6 + 1] = num * 4 + 1;
				array3[num * 6 + 2] = num * 4 + 2;
				array3[num * 6 + 3] = num * 4;
				array3[num * 6 + 4] = num * 4 + 2;
				array3[num * 6 + 5] = num * 4 + 3;
			}
		}
		mesh.SetVertices(array);
		mesh.SetTriangles(array3, 0);
		mesh.SetUVs(1, array2);
		return mesh;
	}

	private Color GetMapColor(int index)
	{
		if (index < 0)
		{
			return Color.black;
		}
		return colors[index % colors.Length].linear;
	}
}
