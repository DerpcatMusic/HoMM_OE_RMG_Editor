using System.Collections.Generic;

namespace Hex.MapGenerator;

public class EncountersInZone
{
	private List<Encounter> encounters;

	private List<int> ambientPickupSlots;

	private int[] startByType;

	private int[] endByType;

	private int[] portalEncounterByConnection;

	private int[] encounterIndexByMandatoryContent;

	private int ambientPickupCount;

	private int missingMandatoryContentSlots;

	public int Count => encounters.Count;

	public int AmbientPickupCount => ambientPickupCount;

	public int MissingMandatoryContentSlots => missingMandatoryContentSlots;

	public List<int> AmbientPickupSlots => ambientPickupSlots;

	public Encounter this[int index]
	{
		get
		{
			return encounters[index];
		}
		set
		{
			encounters[index] = value;
		}
	}

	public EncountersInZone(List<MapDescription.MandatoryContent> mandatoryContentConfigs, List<Encounter> mainObjects, List<Encounter> portals, int[] portalEncounterByConnection, List<Encounter> reserved, List<int> mandatoryContentByReservedEncounter, int mandatoryContentCount, int missingMandatoryContentSlots, int ambientPickupCount, List<Encounter> randomGuarded, List<Encounter> randomUnguarded)
	{
		ambientPickupSlots = new List<int>();
		this.portalEncounterByConnection = portalEncounterByConnection;
		this.ambientPickupCount = ambientPickupCount;
		this.missingMandatoryContentSlots = missingMandatoryContentSlots;
		encounters = new List<Encounter>(mainObjects.Count + portals.Count + reserved.Count + randomGuarded.Count + randomUnguarded.Count);
		startByType = new int[6];
		endByType = new int[6];
		AddType(mainObjects, EncounterType.MainObject);
		AddType(portals, EncounterType.Portal);
		encounterIndexByMandatoryContent = new int[mandatoryContentCount];
		Utils.FillArray(encounterIndexByMandatoryContent, -1);
		List<Encounter> list = new List<Encounter>(randomGuarded.Count + reserved.Count);
		int num = encounters.Count;
		for (int i = 0; i < reserved.Count; i++)
		{
			Encounter item = reserved[i];
			bool flag = item.template.guards.Length != 0;
			int num2 = mandatoryContentByReservedEncounter[i];
			if (num2 != -1)
			{
				flag &= mandatoryContentConfigs[num2].isGuarded;
			}
			if (flag)
			{
				list.Add(item);
				if (num2 != -1)
				{
					encounterIndexByMandatoryContent[num2] = num;
				}
				num++;
			}
		}
		list.AddRange(randomGuarded);
		AddType(list, EncounterType.Guarded);
		List<Encounter> list2 = new List<Encounter>(randomUnguarded.Count + reserved.Count);
		num = encounters.Count;
		for (int j = 0; j < reserved.Count; j++)
		{
			Encounter item2 = reserved[j];
			bool flag2 = item2.template.guards.Length != 0;
			int num3 = mandatoryContentByReservedEncounter[j];
			if (num3 != -1)
			{
				flag2 &= mandatoryContentConfigs[num3].isGuarded;
			}
			if (!flag2)
			{
				list2.Add(item2);
				if (num3 != -1)
				{
					encounterIndexByMandatoryContent[num3] = num;
				}
				num++;
			}
		}
		list2.AddRange(randomUnguarded);
		AddType(list2, EncounterType.Unguarded);
	}

	public Encounter GetEncounter(int index)
	{
		return encounters[index];
	}

	public int BeginByType(EncounterType type)
	{
		return startByType[(int)type];
	}

	public int EndByType(EncounterType type)
	{
		return endByType[(int)type];
	}

	public int GetEncounterIndexForConnection(int connectionIndex)
	{
		return BeginByType(EncounterType.Portal) + portalEncounterByConnection[connectionIndex];
	}

	public int GetEncounterIndexForMandatoryContent(int contentIndex)
	{
		return encounterIndexByMandatoryContent[contentIndex];
	}

	private void AddType(List<Encounter> encountersToAdd, EncounterType type)
	{
		startByType[(int)type] = encounters.Count;
		endByType[(int)type] = encounters.Count + encountersToAdd.Count;
		encounters.AddRange(encountersToAdd);
	}
}
