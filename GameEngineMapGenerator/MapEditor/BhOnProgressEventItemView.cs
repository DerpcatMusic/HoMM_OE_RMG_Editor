using Hex.Session.Quests;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhOnProgressEventItemView : bsq
	{
		[SerializeField]
		private TextMeshProUGUI eventLabel;

		[SerializeField]
		private TMP_Dropdown trigger;

		[SerializeField]
		private TMP_InputField intInput;

		[SerializeField]
		private BhEvents events;

		[SerializeField]
		private BhHierarchyGroup hierarchyGroup;

		private BhOnProgressEvents buvw;

		private ProgressActionData buvx;

		private bool buvy;

		private bool buvz;

		private EProgressTrigger buwa;

		private const string buwb = "{0}({1})";

		public void Init(ProgressActionData _data, BhOnProgressEvents _events)
		{
		}

		public void OnDelete()
		{
		}

		public void UpdateData()
		{
		}

		public override void nud()
		{
		}

		private void nvu()
		{
		}
	}
}
