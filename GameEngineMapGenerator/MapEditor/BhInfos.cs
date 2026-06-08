using UnityEngine;

namespace Hex.MapEditor
{
	public class BhInfos : MonoBehaviour
	{
		public static BhInfos me;

		[SerializeField]
		private BhInfoGroups infoGroups;

		[SerializeField]
		private BhInfoLevels infoLevels;

		[SerializeField]
		private BhInfoIncinirator infoIncinirator;

		[SerializeField]
		private BhInfoClimbs infoClimbs;

		private void Awake()
		{
		}

		public void UpdateValues(EEditorTypes _eEditorTypes)
		{
		}

		public void UpdateValues(EEditorTools _eEditorTools)
		{
		}
	}
}
