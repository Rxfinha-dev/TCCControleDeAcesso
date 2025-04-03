namespace TCCControleDeAcesso.Views
{
    partial class frmTrocandoSenha
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.txtNovaSenha = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.txtNovaSenha2 = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.btnAlterarSenha = new System.Windows.Forms.Button();
            this.chkBoxMostrarSenha = new System.Windows.Forms.CheckBox();
            this.SuspendLayout();
            // 
            // txtNovaSenha
            // 
            this.txtNovaSenha.Location = new System.Drawing.Point(170, 158);
            this.txtNovaSenha.Name = "txtNovaSenha";
            this.txtNovaSenha.Size = new System.Drawing.Size(209, 20);
            this.txtNovaSenha.TabIndex = 3;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(80, 158);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(65, 13);
            this.label2.TabIndex = 2;
            this.label2.Text = "Nova senha";
            // 
            // txtNovaSenha2
            // 
            this.txtNovaSenha2.Location = new System.Drawing.Point(170, 210);
            this.txtNovaSenha2.Name = "txtNovaSenha2";
            this.txtNovaSenha2.Size = new System.Drawing.Size(209, 20);
            this.txtNovaSenha2.TabIndex = 5;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(15, 210);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(132, 13);
            this.label3.TabIndex = 4;
            this.label3.Text = "Repetir a sua nova senha ";
            // 
            // btnAlterarSenha
            // 
            this.btnAlterarSenha.Location = new System.Drawing.Point(290, 251);
            this.btnAlterarSenha.Name = "btnAlterarSenha";
            this.btnAlterarSenha.Size = new System.Drawing.Size(75, 23);
            this.btnAlterarSenha.TabIndex = 6;
            this.btnAlterarSenha.Text = "Alterar Senha";
            this.btnAlterarSenha.UseVisualStyleBackColor = true;
            // 
            // chkBoxMostrarSenha
            // 
            this.chkBoxMostrarSenha.AutoSize = true;
            this.chkBoxMostrarSenha.Location = new System.Drawing.Point(180, 255);
            this.chkBoxMostrarSenha.Name = "chkBoxMostrarSenha";
            this.chkBoxMostrarSenha.Size = new System.Drawing.Size(95, 17);
            this.chkBoxMostrarSenha.TabIndex = 7;
            this.chkBoxMostrarSenha.Text = "Mostrar Senha";
            this.chkBoxMostrarSenha.UseVisualStyleBackColor = true;
            // 
            // frmTrocandoSenha
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(490, 450);
            this.Controls.Add(this.chkBoxMostrarSenha);
            this.Controls.Add(this.btnAlterarSenha);
            this.Controls.Add(this.txtNovaSenha2);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.txtNovaSenha);
            this.Controls.Add(this.label2);
            this.Name = "frmTrocandoSenha";
            this.Text = "frmTrocandoSenha";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion
        private System.Windows.Forms.TextBox txtNovaSenha;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txtNovaSenha2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Button btnAlterarSenha;
        private System.Windows.Forms.CheckBox chkBoxMostrarSenha;
    }
}