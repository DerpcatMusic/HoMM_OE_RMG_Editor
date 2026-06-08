using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhQuestTopNavigationView : MonoBehaviour
	{
		[SerializeField]
		private GameObject questDataPart;

		[SerializeField]
		private GameObject phaseDataPart;

		[SerializeField]
		private TextMeshProUGUI questDataLabel;

		[SerializeField]
		private TextMeshProUGUI phaseDataLabel;

		[SerializeField]
		private BhQuestContentsController contentsController;

		[SerializeField]
		private BhQuestDataView questData;

		[SerializeField]
		private BhPhaseDataView phaseData;

		private EQuestScreen buxk;

		public void nwy(EQuestScreen a)
		{
		}

		public void SetScreen(int _id)
		{
		}

		public void OnArrowClick()
		{
		}

		public void SetUnderline(TextMeshProUGUI _text)
		{
		}

		public void ClearUnderline(TextMeshProUGUI _text)
		{
		}
	}
}
