using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Hex.Configs;
using UnityEngine;

namespace Hex.MapGenerator.Tests;

public class BhMapgenDebugController : MonoBehaviour
{
	public class Toggle
	{
		private bool value;

		private string prefName;

		private string displayName;

		public bool Value => value;

		public static implicit operator bool(Toggle t)
		{
			return t.value;
		}

		public Toggle(string name, string displayName = null, bool defaultVal = false)
		{
			this.displayName = ((displayName != null) ? displayName : name);
			prefName = "MapgenDebugUI|" + name;
			value = PlayerPrefs.GetInt(prefName, defaultVal ? 1 : 0) > 0;
		}

		public bool DrawToggle()
		{
			bool num = value;
			value = GUILayout.Toggle(value, displayName);
			if (num != value)
			{
				PlayerPrefs.SetInt(prefName, value ? 1 : 0);
			}
			return num != value;
		}
	}

	public class StringField
	{
		private string value;

		private string prefName;

		private string displayName;

		public string Value => value;

		public StringField(string name, string displayName = null, string defaultVal = null)
		{
			this.displayName = ((displayName != null) ? displayName : name);
			prefName = "MapgenDebugUI|" + name;
			value = PlayerPrefs.GetString(prefName, (defaultVal == null) ? "" : defaultVal);
		}

		public void SetValue(string s)
		{
			value = s;
			PlayerPrefs.SetString(prefName, value);
		}

		public bool DrawField(float labelWidth)
		{
			string text = value;
			if (labelWidth > 0f)
			{
				GUILayout.BeginHorizontal();
				GUILayout.Label(displayName, GUILayout.Width(labelWidth));
			}
			value = GUILayout.TextField(value);
			if (labelWidth > 0f)
			{
				GUILayout.EndHorizontal();
			}
			bool num = text != value;
			if (num)
			{
				PlayerPrefs.SetString(prefName, value);
			}
			return num;
		}

		public void DrawLabel()
		{
			GUILayout.Label(value);
		}
	}

	public class IntField
	{
		private int value;

		private string currentString;

		private string prefName;

		private string displayName;

		public int Value => value;

		public IntField(string name, string displayName = null)
		{
			this.displayName = ((displayName != null) ? displayName : name);
			prefName = "MapgenDebugUI|" + name;
			value = PlayerPrefs.GetInt(prefName, 0);
			currentString = value.ToString();
		}

		public bool DrawField(float labelWidth = 0f)
		{
			string text = currentString;
			if (labelWidth > 0f)
			{
				GUILayout.BeginHorizontal();
				GUILayout.Label(displayName, GUILayout.Width(labelWidth));
			}
			currentString = GUILayout.TextField(text);
			if (labelWidth > 0f)
			{
				GUILayout.EndHorizontal();
			}
			bool num = text != currentString;
			if (num && int.TryParse(currentString, out value))
			{
				PlayerPrefs.SetInt(prefName, value);
			}
			return num;
		}

		public bool DrawSelectionGrid(string[] names, int xCount)
		{
			int num = value;
			value = GUILayout.SelectionGrid(value, names, xCount);
			if (num != value)
			{
				PlayerPrefs.SetInt(prefName, value);
			}
			return num != value;
		}
	}

	public class GeneratorTestParams
	{
		public string templateJson;

		public int seed;

		public string[] spawnFactions;

		public GeneratorTestParams(string templateName, int seed, string spawnFactions)
		{
			if (!Generator.GetConfig().TryGetMapTemplateJsonByName(templateName, out templateJson))
			{
				Log.Error("Template " + templateName + " doesn't exist.");
			}
			this.seed = seed;
			string[] array = spawnFactions.Split(',');
			this.spawnFactions = new string[array.Length];
			for (int i = 0; i < array.Length; i++)
			{
				this.spawnFactions[i] = array[i].Trim();
			}
		}
	}

	public class Results
	{
		public readonly string allContent;

		public readonly Statistics statistics;

		public readonly string report;

		public readonly string fileName;

		public Results(string allContent, Statistics statistics, string report, string fileName)
		{
			this.allContent = allContent;
			this.statistics = statistics;
			this.report = report;
			this.fileName = fileName;
		}
	}

	public const string PrefsPrefix = "MapgenDebugUI";

	public const float PreviewSize = 10f;

	[Header("Textures")]
	public Texture2D texture;

	public Texture2D elevation;

	public StringField templateName;

	public IntField seed;

	public StringField spawnFactions;

	public IntField mapSizeX;

	public IntField mapSizeY;

	public IntField batchCount;

	public IntField mode;

	public IntField backgroundMode;

	public Toggle showElevation;

	public Toggle showEncounters;

	public Toggle showPaths;

	public Toggle showPathClusters;

	public Toggle showGraph;

	public Toggle showKeypoints;

	public Toggle showPathGraph;

	public Toggle showIcons;

	public Toggle roadIcons;

	public Toggle riverIcons;

	public Toggle reservedIcons;

	public Toggle encounterIcons;

	public Toggle guardIcons;

	public Toggle ambientPickupIcons;

	public Toggle highlightMandatory;

	public Toggle tooltipContent;

	public Toggle tooltipMapObject;

	public Toggle tooltipEncounter;

	public Toggle zoneInfoEnabled;

	public Toggle zoneInfoGeneral;

	public Toggle zoneInfoGuarded;

	public Toggle zoneInfoUnguarded;

	public Toggle zoneInfoPoolInfo;

	public Toggle zoneInfoSearchCount;

	public IntField searchMode;

	public StringField searchString;

	public StringField savePath;

	public Color[] colors = new Color[12]
	{
		new Color32(102, 153, 204, byte.MaxValue),
		new Color32(byte.MaxValue, 242, 117, byte.MaxValue),
		new Color32(byte.MaxValue, 140, 66, byte.MaxValue),
		new Color32(byte.MaxValue, 60, 56, byte.MaxValue),
		new Color32(162, 62, 72, byte.MaxValue),
		new Color32(20, 120, 72, byte.MaxValue),
		new Color32(120, 70, 120, byte.MaxValue),
		new Color32(70, 150, 120, byte.MaxValue),
		new Color32(100, 100, 100, byte.MaxValue),
		new Color32(200, 200, 200, byte.MaxValue),
		new Color32(50, 50, 200, byte.MaxValue),
		new Color32(200, 50, 200, byte.MaxValue)
	};

	private bool isInitialized;

	private Results results;

	private int seedIncrement = -1;

	private int currentBatchIndex = -1;

	private int currentBatchCount = -1;

	private List<BhDebugMapDrawer> drawers = new List<BhDebugMapDrawer>();

	private List<BhDebugMapDrawer.ViewData> viewDatas;

	private string[] modeNames;

	private string[] backgroundModeNames;

	private string[] searchModeNames;

	private GUIStyle centeredTextStyle;

	public MapgenDebugMode Mode => (MapgenDebugMode)mode.Value;

	public BhDebugMapDrawer.BackgroundMode BackgroundMode => (BhDebugMapDrawer.BackgroundMode)backgroundMode.Value;

	public SearchMode SearchMode => (SearchMode)searchMode.Value;

	private void Awake()
	{
		DB.Instance();
		modeNames = Enum.GetNames(typeof(MapgenDebugMode));
		backgroundModeNames = Enum.GetNames(typeof(BhDebugMapDrawer.BackgroundMode));
		searchModeNames = Enum.GetNames(typeof(SearchMode));
		templateName = new StringField("Template");
		spawnFactions = new StringField("Spawn Factions");
		seed = new IntField("Seed");
		mapSizeX = new IntField("Size X");
		mapSizeY = new IntField("Size Y");
		batchCount = new IntField("Batch Count", "Count");
		mode = new IntField("MapgenDebugMode");
		backgroundMode = new IntField("BackgroundMode");
		searchMode = new IntField("Search Mode");
		searchString = new StringField("Search String");
		showElevation = new Toggle("Elevation");
		showEncounters = new Toggle("Encounters");
		showPaths = new Toggle("Paths");
		showPathClusters = new Toggle("Path Clusters");
		showGraph = new Toggle("Zone Graph");
		showKeypoints = new Toggle("Keypoints");
		showPathGraph = new Toggle("Path Graph");
		showIcons = new Toggle("Icons");
		roadIcons = new Toggle("Roads");
		riverIcons = new Toggle("Rivers");
		reservedIcons = new Toggle("Reserved");
		encounterIcons = new Toggle("EncounterIcons", "Encounters");
		guardIcons = new Toggle("GuardIcons", "Guards");
		ambientPickupIcons = new Toggle("Ambient Pickups");
		highlightMandatory = new Toggle("Highlight Mandatory");
		tooltipContent = new Toggle("TooltipContent", "Content");
		tooltipMapObject = new Toggle("TooltipMapObjects", "MapObjects");
		tooltipEncounter = new Toggle("TooltipEncounters", "Encounters");
		zoneInfoEnabled = new Toggle("ZoneInfoEnabled", "Zone Info");
		zoneInfoGeneral = new Toggle("ZoneInfoGeneral", "General");
		zoneInfoGuarded = new Toggle("Guarded");
		zoneInfoUnguarded = new Toggle("Unguarded");
		zoneInfoPoolInfo = new Toggle("Pool");
		zoneInfoSearchCount = new Toggle("SearchCount");
		savePath = new StringField("Save Path");
		isInitialized = true;
	}

	private void Update()
	{
		if (Mode == MapgenDebugMode.Single && Input.GetKeyDown(KeyCode.Space))
		{
			seedIncrement++;
			Generate();
		}
	}

	private void Generate()
	{
		GeneratorTestParams generatorTestParams = new GeneratorTestParams(templateName.Value, seed.Value, spawnFactions.Value);
		if (seedIncrement >= 0)
		{
			generatorTestParams.seed += seedIncrement;
		}
		BhDebugMapDrawer.ViewData viewData = Generate(generatorTestParams);
		if (viewData != null)
		{
			viewDatas = new List<BhDebugMapDrawer.ViewData> { viewData };
			PreviewMaps(viewDatas);
			MapDescription mapDesc = viewData.mapDesc;
			string text = mapDesc.name;
			int sizeX = mapDesc.sizeX;
			int sizeZ = mapDesc.sizeZ;
			StringBuilder stringBuilder = new StringBuilder();
			viewData.contentDubug.SerializeContentList(stringBuilder, 0, newLine: false);
			string allContent = stringBuilder.ToString();
			Statistics statistics = new Statistics(mapDesc.template);
			statistics.AppendData(viewData.mapDesc.templateVariant, viewData.contentDubug);
			string report = $"{text}\nSeed: {generatorTestParams.seed}\nSize: {sizeX}x{sizeZ}\nGenerated in {(int)(viewData.generationTime * 1000f)} ms";
			string fileName = $"{text}_{generatorTestParams.seed}";
			results = new Results(allContent, statistics, report, fileName);
		}
	}

	private void StartBatchGenerate()
	{
		GeneratorTestParams test = new GeneratorTestParams(templateName.Value, seed.Value, spawnFactions.Value);
		StartCoroutine(GenerateBatch(test, Mathf.Max(batchCount.Value, 1)));
	}

	public void PreviewMaps(List<BhDebugMapDrawer.ViewData> viewDatas)
	{
		this.viewDatas = viewDatas;
		EnsureDrawers(viewDatas.Count);
		for (int i = 0; i < viewDatas.Count; i++)
		{
			drawers[i].PreviewMap(viewDatas[i]);
			drawers[i].UpdateSearch(searchString.Value, SearchMode);
		}
	}

	private void OnGUI()
	{
		if (!isInitialized)
		{
			return;
		}
		if (centeredTextStyle == null)
		{
			centeredTextStyle = new GUIStyle(GUI.skin.label);
			centeredTextStyle.alignment = TextAnchor.MiddleCenter;
		}
		GUI.enabled = currentBatchIndex == -1;
		float num = (float)Screen.height * 1.5f / 1080f;
		GUI.matrix = Matrix4x4.TRS(Vector3.zero, Quaternion.identity, new Vector3(num, num, 1f));
		bool generate = false;
		bool batchGenerate = false;
		bool updateMesh = false;
		bool updateSearch = false;
		GUILayout.BeginVertical(GUILayout.Width((float)Screen.width / num));
		GUILayout.BeginHorizontal();
		DrawLeftPanel(ref updateMesh);
		GUILayout.FlexibleSpace();
		DrawRightPanel(ref generate, ref batchGenerate, ref updateSearch);
		GUILayout.EndHorizontal();
		GUILayout.EndVertical();
		GUI.enabled = true;
		if (generate)
		{
			seedIncrement = 0;
			Generate();
		}
		if (batchGenerate)
		{
			StartBatchGenerate();
		}
		if (updateMesh && viewDatas != null)
		{
			for (int i = 0; i < viewDatas.Count; i++)
			{
				drawers[i].PreviewMap(viewDatas[i]);
			}
		}
		if (updateSearch && viewDatas != null)
		{
			for (int j = 0; j < viewDatas.Count; j++)
			{
				drawers[j].UpdateSearch(searchString.Value, SearchMode);
			}
		}
	}

	private void DrawLeftPanel(ref bool updateMesh)
	{
		GUILayout.BeginVertical();
		GUILayout.BeginVertical(GUI.skin.box);
		GUILayout.Label("Background");
		updateMesh |= backgroundMode.DrawSelectionGrid(backgroundModeNames, 1);
		GUILayout.EndVertical();
		GUILayout.BeginVertical(GUI.skin.box);
		showIcons.DrawToggle();
		if ((bool)showIcons)
		{
			updateMesh |= roadIcons.DrawToggle();
			updateMesh |= riverIcons.DrawToggle();
			updateMesh |= reservedIcons.DrawToggle();
			updateMesh |= encounterIcons.DrawToggle();
			updateMesh |= guardIcons.DrawToggle();
			updateMesh |= ambientPickupIcons.DrawToggle();
			updateMesh |= highlightMandatory.DrawToggle();
		}
		GUILayout.EndVertical();
		GUILayout.BeginVertical(GUI.skin.box);
		showElevation.DrawToggle();
		updateMesh |= showPaths.DrawToggle();
		updateMesh |= showPathClusters.DrawToggle();
		showEncounters.DrawToggle();
		showGraph.DrawToggle();
		showKeypoints.DrawToggle();
		showPathGraph.DrawToggle();
		GUILayout.EndVertical();
		GUILayout.BeginVertical(GUI.skin.box);
		GUILayout.Label("Tooltip");
		tooltipContent.DrawToggle();
		tooltipMapObject.DrawToggle();
		tooltipEncounter.DrawToggle();
		GUILayout.EndVertical();
		GUILayout.BeginVertical(GUI.skin.box);
		GUILayout.Label("Zone Info");
		zoneInfoEnabled.DrawToggle();
		if ((bool)zoneInfoEnabled)
		{
			zoneInfoGeneral.DrawToggle();
			zoneInfoGuarded.DrawToggle();
			zoneInfoUnguarded.DrawToggle();
			zoneInfoPoolInfo.DrawToggle();
			zoneInfoSearchCount.DrawToggle();
		}
		GUILayout.EndVertical();
		GUILayout.EndVertical();
	}

	private void DrawRightPanel(ref bool generate, ref bool batchGenerate, ref bool updateSearch)
	{
		GUILayout.BeginVertical();
		DrawGenerationSettings(ref generate, ref batchGenerate);
		DrawSearch(ref updateSearch);
		DrawResultsMenu();
		GUILayout.EndVertical();
	}

	private void DrawGenerationSettings(ref bool generate, ref bool batchGenerate)
	{
		float labelWidth = 100f;
		GUILayout.BeginVertical(GUI.skin.box);
		mode.DrawSelectionGrid(modeNames, modeNames.Length);
		templateName.DrawField(labelWidth);
		seed.DrawField(labelWidth);
		spawnFactions.DrawField(labelWidth);
		if (Mode == MapgenDebugMode.Single)
		{
			generate = GUILayout.Button("Generate");
			GUILayout.Label("[space] to generate next", centeredTextStyle);
		}
		else
		{
			batchCount.DrawField(labelWidth);
			batchGenerate = GUILayout.Button("Generate");
			if (currentBatchIndex != -1)
			{
				GUILayout.Label($"Generating...{currentBatchIndex}/{currentBatchCount}");
			}
		}
		GUILayout.EndVertical();
	}

	private void DrawResultsMenu()
	{
		if (results == null)
		{
			return;
		}
		GUILayout.BeginVertical(GUI.skin.box);
		GUILayout.Label("Latest generation:");
		GUILayout.Label(results.report);
		savePath.DrawField(100f);
		if (GUILayout.Button("Save Raw"))
		{
			File.WriteAllText(RawDataFileName(), results.allContent);
			Log.Message("Raw saved at '" + savePath.Value + "'");
		}
		if (GUILayout.Button("Save Stats"))
		{
			for (int i = 0; i < results.statistics.VariantCount; i++)
			{
				File.WriteAllText(SummaryFileName(i), results.statistics.SummaryCsv(i));
				File.WriteAllText(ContentListsFileName(i), results.statistics.ContentListCsv(i));
				File.WriteAllText(SpecificObjectsFileName(i), results.statistics.SpecificObjectsCsv(i));
			}
			Log.Message("Stats saved at '" + savePath.Value + "'");
		}
		GUILayout.EndVertical();
	}

	private void DrawSearch(ref bool updateSearch)
	{
		GUILayout.BeginVertical(GUI.skin.box);
		GUILayout.Label("Search");
		updateSearch |= searchMode.DrawSelectionGrid(searchModeNames, searchModeNames.Length);
		updateSearch |= searchString.DrawField(0f);
		if (GUILayout.Button("Clear"))
		{
			searchString.SetValue("");
			updateSearch = true;
		}
		GUILayout.EndVertical();
	}

	private string RawDataFileName()
	{
		return savePath.Value + "/" + results.fileName + "_raw.csv";
	}

	private string SummaryFileName(int variant)
	{
		return $"{savePath.Value}/{results.fileName}_v{variant}_summary.csv";
	}

	private string ContentListsFileName(int variant)
	{
		return $"{savePath.Value}/{results.fileName}_v{variant}_content_lists.csv";
	}

	private string SpecificObjectsFileName(int variant)
	{
		return $"{savePath.Value}/{results.fileName}_v{variant}_objects.csv";
	}

	private void EnsureDrawers(int count)
	{
		for (int i = drawers.Count; i < count; i++)
		{
			drawers.Add(BhDebugMapDrawer.Instantiate(this, DrawerPosition(i)));
		}
	}

	private Vector2 DrawerPosition(int index)
	{
		return Vector2.right * index * 10f;
	}

	public static BhDebugMapDrawer.ViewData Generate(GeneratorTestParams test)
	{
		float realtimeSinceStartup = Time.realtimeSinceStartup;
		Generator.GeneratorResult generatorResult = Generator.Generate(test.templateJson, test.seed, test.spawnFactions, 1, checksum: false, debugInfo: true);
		if (generatorResult.mapData == null)
		{
			return null;
		}
		float time = Time.realtimeSinceStartup - realtimeSinceStartup;
		return new BhDebugMapDrawer.ViewData(Generator.GetConfig(), generatorResult.layout.MapDesc, generatorResult.layout, generatorResult.contentPlacer, generatorResult.mapData, time);
	}

	public IEnumerator GenerateBatch(GeneratorTestParams test, int count)
	{
		Statistics statistics = null;
		StringBuilder sb = new StringBuilder();
		float time = Time.realtimeSinceStartup;
		Generator.GeneratorResult genResult = default(Generator.GeneratorResult);
		currentBatchCount = count;
		currentBatchIndex = 0;
		yield return null;
		for (int i = 0; i < count; i++)
		{
			currentBatchIndex = i;
			genResult = Generator.Generate(test.templateJson, test.seed + i, test.spawnFactions, 1, checksum: false, debugInfo: true);
			if (genResult.mapData != null)
			{
				genResult.contentPlacer.GetDebugInfo().SerializeContentList(sb, i, i > 0);
				if (statistics == null)
				{
					statistics = new Statistics(genResult.layout.MapDesc.template);
				}
				statistics.AppendData(genResult.layout.MapDesc.templateVariant, genResult.contentPlacer.GetDebugInfo());
			}
			yield return null;
		}
		currentBatchIndex = -1;
		float num = Time.realtimeSinceStartup - time;
		if (genResult.mapData != null)
		{
			MapDescription mapDesc = genResult.layout.MapDesc;
			string text = mapDesc.name;
			int sizeX = mapDesc.sizeX;
			int sizeZ = mapDesc.sizeZ;
			string allContent = sb.ToString();
			string report = $"Count: {count}\n{text}\nSeeds: {test.seed}-{test.seed + count - 1}\nSize: {sizeX}x{sizeZ}\nGenerated in {(int)num} s";
			string fileName = $"{text}_x{count}_{test.seed}-{test.seed + count - 1}";
			results = new Results(allContent, statistics, report, fileName);
		}
	}
}
